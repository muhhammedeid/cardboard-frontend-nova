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
const HTML_TAG = /<[^>]*>/g
const SUMMARY = /<summary[^>]*>([\s\S]*?)<\/summary>/i
const DETAILS_BLOCK = /<details[^>]*>[\s\S]*?<\/details>/gi

/** Serialized internals must never reach an operator. */
function looksLikeMetadata(text: string): boolean {
  return /(?:Traceback|exc_type|frappe\.exceptions\.|__frappe_exc_id|<class\s|File ")/i.test(text)
}

function clean(text: string): string {
  // Frappe puts the operator sentence in <summary> and the traceback in the
  // details body, so take the summary and never the internals below it.
  const summary = SUMMARY.exec(text)
  const source = summary ? summary[1] : text.replace(DETAILS_BLOCK, ' ')
  return source
    .replace(HTML_TAG, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Frappe returns thrown validation messages as a serialized array in
 * `_server_messages`, often wrapped in a `<details>` block:
 *
 *   ["{\"message\": \"<details><summary>To Date cannot be in the future</summary>…\", \"title\": …}"]
 *
 * Operators need that sentence, but never the traceback or the exception
 * metadata around it. This extracts the first clean, human-looking sentence and
 * refuses anything that still looks like serialized internals.
 */
export function extractServerMessage(serialized?: string | null): string | undefined {
  if (!serialized) return undefined
  const trimmed = serialized.trim()
  if (!trimmed) return undefined

  let entries: unknown[]
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      entries = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return undefined
    }
  } else {
    entries = [trimmed]
  }

  for (const entry of entries) {
    let text: string | undefined
    if (typeof entry === 'string') {
      try {
        const nested: unknown = JSON.parse(entry)
        if (nested && typeof nested === 'object') {
          text = String((nested as { message?: unknown }).message ?? '')
        } else {
          text = entry
        }
      } catch {
        text = entry
      }
    } else if (entry && typeof entry === 'object') {
      text = String((entry as { message?: unknown }).message ?? '')
    }
    const candidate = clean(text ?? '')
    if (candidate && !looksLikeMetadata(candidate)) return candidate
  }
  return undefined
}

export function normalizeApiError(status: number, serverMessages?: string | null): FrontendError {
  const normalized = extractServerMessage(serverMessages)
  if (status === 401) return new FrontendError('authentication', normalized ?? 'انتهت جلسة الدخول. يرجى إعادة الدخول.', status)
  if (status === 403) return new FrontendError('permission', normalized ?? 'ليس لديك صلاحية لتنفيذ هذا الإجراء.', status)
  if (status === 404) return new FrontendError('not_found', normalized ?? 'العنصر المطلوب غير موجود.', status)
  if (status >= 400 && status < 500) return new FrontendError('validation', normalized ?? GENERIC_FALLBACK, status)
  return new FrontendError('unexpected', normalized ?? GENERIC_FALLBACK, status)
}

export function toFrontendError(value: unknown, fallback: string): FrontendError {
  if (value instanceof FrontendError) return value
  if (value instanceof Error) {
    const message = extractServerMessage(value.message) ?? fallback
    return new FrontendError('unexpected', message)
  }
  return new FrontendError('unexpected', fallback)
}

export function errorMessage(value: unknown, fallback: string): string {
  return toFrontendError(value, fallback).message
}
