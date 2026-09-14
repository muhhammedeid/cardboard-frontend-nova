export type FrontendErrorKind = 'network' | 'authentication' | 'permission' | 'validation' | 'not_found' | 'unexpected'

/**
 * Single normalized error shape for the whole app. Transport-level failures and
 * app-owned contract envelopes (`*_error`) both land here, so screens only ever
 * render `error.message` and branch on `error.kind`.
 */
export class FrontendError extends Error {
  readonly kind: FrontendErrorKind
  readonly status: number | undefined
  /** Backend contract code when the failure came from an app-owned envelope. */
  readonly code?: string
  /** Backend-named field for field-level validation feedback. */
  readonly field?: string

  constructor(kind: FrontendErrorKind, message: string, status?: number, code?: string, field?: string) {
    super(message)
    this.name = 'FrontendError'
    this.kind = kind
    this.status = status
    this.code = code
    this.field = field
  }
}

const GENERIC_FALLBACK = 'تعذر إتمام الطلب. حاول مرة أخرى.'

/** Frappe serialized metadata must never reach an operator as a message. */
function safeMessage(message?: string): string | undefined {
  if (!message) return undefined
  const trimmed = message.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return undefined
  if (/(?:_server_messages|exc_type|traceback|<class)/i.test(trimmed)) return undefined
  return trimmed
}

export function normalizeApiError(status: number, message?: string): FrontendError {
  const normalized = safeMessage(message)
  if (status === 401) return new FrontendError('authentication', normalized ?? 'انتهت جلسة الدخول. يرجى إعادة الدخول.', status)
  if (status === 403) return new FrontendError('permission', normalized ?? 'ليس لديك صلاحية لتنفيذ هذا الإجراء.', status)
  if (status === 404) return new FrontendError('not_found', normalized ?? 'العنصر المطلوب غير موجود.', status)
  if (status >= 400 && status < 500) return new FrontendError('validation', normalized ?? GENERIC_FALLBACK, status)
  return new FrontendError('unexpected', normalized ?? GENERIC_FALLBACK, status)
}

export function toFrontendError(value: unknown, fallback: string): FrontendError {
  if (value instanceof FrontendError) return value
  if (value instanceof Error) return new FrontendError('unexpected', safeMessage(value.message) ?? fallback)
  return new FrontendError('unexpected', fallback)
}

export function errorMessage(value: unknown, fallback: string): string {
  return toFrontendError(value, fallback).message
}
