import { describe, expect, it } from 'vitest'

import { FrontendError, extractServerMessage, normalizeApiError } from './errors'

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
