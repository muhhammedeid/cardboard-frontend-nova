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
 * Cookie-session transport for the Frappe RPC boundary.
 * - `credentials: 'include'` keeps the Frappe session cookie.
 * - The CSRF token is fetched once from the app-owned session endpoint and
 *   reused; failures are surfaced as FrontendError instead of raw fetches.
 */
export class FrappeRpcTransport implements RpcTransport {
  private readonly baseUrl: string
  private csrfToken: string | undefined
  private csrfTokenRequest: Promise<string> | undefined

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, { credentials: 'include', ...init })
    } catch {
      throw new FrontendError('network', 'تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.')
    }
  }

  private async loadCsrfToken(): Promise<string> {
    const response = await this.request(`/api/method/${SESSION_CONTEXT_METHOD}`, {
      method: 'GET',
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

  async call<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
    const response = await this.request(`/api/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Frappe-CSRF-Token': await this.getCsrfToken(),
      },
      body: JSON.stringify(args),
    })

    const body = (await response.json().catch(() => ({}))) as FrappeResponse<T>

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

  /** Session identity for the shell (user display name). */
  async sessionContext(): Promise<SessionContext> {
    const raw = await this.call<{ user: string; csrf_token: string }>(SESSION_CONTEXT_METHOD)
    return { user: raw.user, csrfToken: raw.csrf_token }
  }
}
