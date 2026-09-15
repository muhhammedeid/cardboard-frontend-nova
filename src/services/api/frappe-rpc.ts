import { FrontendError, normalizeApiError } from './errors'

export interface RpcTransport {
  call<T>(method: string, args?: Record<string, unknown>): Promise<T>
}

export interface SessionContext {
  user: string
  csrfToken: string
}

interface ContractError {
  code: string
  message: string
  field?: string
}

interface FrappeResponse<T> {
  message?: T
  exc_type?: string
  exception?: string
  _server_messages?: string
  supplier_error?: ContractError
  supply_error?: ContractError
  sale_error?: ContractError
  supplier_payment_error?: ContractError
  expense_error?: ContractError
  operational_settings_error?: ContractError
}

/** Every app-owned feature registers its envelope key here, so a rejected
 *  request never bypasses its feature message path. */
const CONTRACT_ERROR_KEYS = [
  'supply_error',
  'sale_error',
  'supplier_error',
  'supplier_payment_error',
  'expense_error',
  'operational_settings_error',
] as const

const PERMISSION_CODES = new Set(['permission_denied', 'permission', 'forbidden'])
const NOT_FOUND_CODES = new Set(['not_found', 'does_not_exist'])

export const SESSION_CONTEXT_METHOD = 'cardboard_management.cardboard_management.api.session.get_session_context'

/** A hung request must never leave the operator staring at a spinner. */
export const REQUEST_TIMEOUT_MS = 30_000

function contractError(body: FrappeResponse<unknown>): ContractError | undefined {
  for (const key of CONTRACT_ERROR_KEYS) {
    const value = body[key]
    if (value && typeof value.message === 'string') return value
  }
  return undefined
}

function kindForContractCode(code: string): FrontendError['kind'] {
  if (PERMISSION_CODES.has(code)) return 'permission'
  if (NOT_FOUND_CODES.has(code)) return 'not_found'
  return 'validation'
}

/**
 * Frappe rejects a stale CSRF token with a CSRF-specific failure. That is
 * recoverable (the session is still valid), so it is retried once with a fresh
 * token instead of surfacing as a permission error to the operator.
 */
export function isCsrfFailure(status: number, body: FrappeResponse<unknown>): boolean {
  if (status !== 400 && status !== 403 && status !== 417) return false
  const haystack = [body.exc_type, body.exception, body._server_messages].filter(Boolean).join(' ')
  return /csrf|invalid request/i.test(haystack)
}

/**
 * Cookie-session transport for the Frappe RPC boundary.
 * - `credentials: 'include'` keeps the Frappe session cookie.
 * - The CSRF token is fetched once from the app-owned session endpoint and
 *   reused; a stale token is refreshed exactly once, and every failure is
 *   surfaced as a FrontendError instead of a raw fetch error.
 * - Every request is bounded by REQUEST_TIMEOUT_MS.
 */
export class FrappeRpcTransport implements RpcTransport {
  private readonly baseUrl: string
  private csrfToken: string | undefined
  private csrfTokenRequest: Promise<string> | undefined

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      return await fetch(`${this.baseUrl}${path}`, { credentials: 'include', ...init, signal: controller.signal })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new FrontendError('network', 'تأخر الخادم في الرد. حاول مرة أخرى.')
      }
      throw new FrontendError('network', 'تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.')
    } finally {
      clearTimeout(timer)
    }
  }

  private async loadCsrfToken(): Promise<string> {
    // `no-store` plus a cache-buster: a cached copy of this GET would keep handing back the
    // token of a previous session, and every POST would then answer 403 (CSRF) — even after
    // the built-in retry, which would reuse the same cached response.
    const response = await this.request(`/api/method/${SESSION_CONTEXT_METHOD}?ts=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    const body = (await response.json().catch(() => ({}))) as FrappeResponse<{ csrf_token?: string }>
    if (!response.ok) throw normalizeApiError(response.status, body._server_messages)
    const token = body.message?.csrf_token
    if (!token) throw new FrontendError('authentication', 'تعذر التحقق من جلسة الدخول.', response.status)
    this.csrfToken = token
    return token
  }

  private async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken
    this.csrfTokenRequest ??= this.loadCsrfToken().finally(() => {
      this.csrfTokenRequest = undefined
    })
    return this.csrfTokenRequest
  }

  private async post<T>(method: string, args: Record<string, unknown>): Promise<{ response: Response; body: FrappeResponse<T> }> {
    const response = await this.request(`/api/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Frappe-CSRF-Token': await this.getCsrfToken(),
      },
      body: JSON.stringify(args),
    })
    return { response, body: (await response.json().catch(() => ({}))) as FrappeResponse<T> }
  }

  async call<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
    let { response, body } = await this.post<T>(method, args)

    if (isCsrfFailure(response.status, body)) {
      // One retry only: a second failure is a real rejection, not a stale token.
      this.csrfToken = undefined
      ;({ response, body } = await this.post<T>(method, args))
    }

    if (!response.ok) {
      const failure = contractError(body)
      if (failure) {
        throw new FrontendError(kindForContractCode(failure.code), failure.message, response.status, failure.code, failure.field)
      }
      throw normalizeApiError(response.status, body._server_messages)
    }

    if (body.message === undefined) {
      throw new FrontendError('unexpected', 'استجابة الخادم غير مكتملة.')
    }

    return body.message
  }

  /**
   * Session identity for the shell (user display name).
   *
   * This endpoint is `methods=["GET"]`. Posting to it answers 403 — a permission-looking
   * error for what is only a wrong verb — and the shell would then treat a perfectly valid
   * session as signed out and keep the gate on screen. The GET is also where Frappe issues
   * the CSRF token, so the token from this response is cached for the next POST.
   */
  async sessionContext(): Promise<SessionContext> {
    const response = await this.request(`/api/method/${SESSION_CONTEXT_METHOD}?ts=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    const body = (await response.json().catch(() => ({}))) as FrappeResponse<{
      user?: string
      csrf_token?: string
    }>

    if (!response.ok) {
      // The session endpoint is the one place where a denial means "not signed in"
      // rather than "not allowed".
      if (response.status === 401 || response.status === 403) {
        throw new FrontendError('authentication', 'يلزم تسجيل الدخول للمتابعة.', response.status)
      }
      throw normalizeApiError(response.status, body._server_messages)
    }

    const token = body.message?.csrf_token
    if (token) this.csrfToken = token
    return { user: body.message?.user ?? '', csrfToken: token ?? '' }
  }
}
