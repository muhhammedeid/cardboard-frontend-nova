import { describe, expect, it } from 'vitest'

import { FrontendError, extractServerMessage, normalizeApiError } from './errors'
import { ERROR_FUTURE_DATE, ERROR_STALE_MODULE } from '@/services/real/__fixtures__/observed'

const serialized = (message: string) =>
  JSON.stringify([JSON.stringify({ message: `<details><summary>${message}</summary><div>stack</div></details>`, title: 'Error' })])

describe('extractServerMessage', () => {
  it('reads the operator sentence out of a serialized details block', () => {
    expect(extractServerMessage(serialized('To Date cannot be in the future'))).toBe('To Date cannot be in the future')
  })

  it('keeps a plain thrown message as-is', () => {
    expect(extractServerMessage('لا توجد فواتير مستحقة لهذا المورد')).toBe('لا توجد فواتير مستحقة لهذا المورد')
  })

  it('refuses serialized internals instead of showing them to an operator', () => {
    const traceback = JSON.stringify([JSON.stringify({ message: 'Traceback (most recent call last): File "x.py", line 3' })])
    expect(extractServerMessage(traceback)).toBeUndefined()
    expect(extractServerMessage('{"exc_type":"ValidationError"}')).toBeUndefined()
    expect(extractServerMessage('[]')).toBeUndefined()
    expect(extractServerMessage(null)).toBeUndefined()
  })
})

describe('normalizeApiError', () => {
  it('surfaces the backend sentence for a rejected validation', () => {
    const error = normalizeApiError(417, serialized('To Date cannot be in the future'))

    expect(error).toBeInstanceOf(FrontendError)
    expect(error.kind).toBe('validation')
    expect(error.message).toBe('To Date cannot be in the future')
  })

  it('falls back to Arabic copy when the backend says nothing usable', () => {
    expect(normalizeApiError(500, '{"exc_type":"ValidationError"}').message).toBe('تعذر إتمام الطلب. حاول مرة أخرى.')
  })

  it('maps status codes onto operator-facing kinds', () => {
    expect(normalizeApiError(401, undefined).kind).toBe('authentication')
    expect(normalizeApiError(403, undefined).kind).toBe('permission')
    expect(normalizeApiError(404, undefined).kind).toBe('not_found')
  })
})

/** Payloads captured from the live site, so the contract is proved against reality. */
describe('operator messages captured from cardboard.localhost', () => {
  it('shows the Arabic reporting sentence, never the traceback around it', () => {
    const message = extractServerMessage(ERROR_FUTURE_DATE._server_messages)

    expect(message).toBe('لا يمكن أن يكون تاريخ النهاية في المستقبل')
    expect(message).not.toMatch(/Traceback|File "/)
  })

  it('keeps the module name inside the missing-route sentence', () => {
    const message = extractServerMessage(ERROR_STALE_MODULE._server_messages)

    expect(message).toContain('cardboard_management.api.supply.list_supplies')
    expect(message).not.toMatch(/Traceback|File "/)
  })

  it('maps the live rejected request to a validation error carrying that sentence', () => {
    const error = normalizeApiError(417, ERROR_FUTURE_DATE._server_messages)

    expect(error.kind).toBe('validation')
    expect(error.message).toBe('لا يمكن أن يكون تاريخ النهاية في المستقبل')
  })
})
