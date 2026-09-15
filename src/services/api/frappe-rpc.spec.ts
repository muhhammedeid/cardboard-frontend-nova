import { afterEach, describe, expect, it, vi } from 'vitest'

import { FrontendError } from './errors'
import { FrappeRpcTransport, REQUEST_TIMEOUT_MS, SESSION_CONTEXT_METHOD, isCsrfFailure } from './frappe-rpc'

const json = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response

const csrfRejected = { exc_type: 'CSRFTokenError', exception: 'frappe.exceptions.CSRFTokenError: Invalid Request' }

interface Call {
  url: string
  init: RequestInit
}

function stub(calls: Call[], handler: (url: string, init: RequestInit, index: number) => Response | Promise<Response>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown, init: unknown) => {
      const call: Call = { url: String(url), init: (init ?? {}) as RequestInit }
      calls.push(call)
      return handler(call.url, call.init, calls.length - 1)
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('isCsrfFailure', () => {
  it('only recognises a CSRF-shaped rejection', () => {
    expect(isCsrfFailure(403, csrfRejected)).toBe(true)
    expect(isCsrfFailure(400, { exc_type: 'InvalidRequestError', _server_messages: '["Invalid Request"]' })).toBe(true)
    expect(isCsrfFailure(403, { exc_type: 'PermissionError', exception: 'Not permitted' })).toBe(false)
    expect(isCsrfFailure(500, csrfRejected)).toBe(false)
  })
})

describe('FrappeRpcTransport', () => {
  it('fetches the CSRF token with GET and posts it with every write', async () => {
    const calls: Call[] = []
    stub(calls, (url) => (url.includes(SESSION_CONTEXT_METHOD) ? json({ message: { user: 'u', csrf_token: 'tok-1' } }) : json({ message: { ok: true } })))

    const value = await new FrappeRpcTransport('').call('app.method', { a: 1 })

    expect(value).toEqual({ ok: true })
    expect(calls[0].url).toContain(SESSION_CONTEXT_METHOD)
    expect(calls[0].init.method).toBe('GET')
    expect(calls[1].init.method).toBe('POST')
    expect((calls[1].init.headers as Record<string, string>)['X-Frappe-CSRF-Token']).toBe('tok-1')
    expect(calls[1].init.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('refreshes a stale CSRF token and replays the call once', async () => {
    const calls: Call[] = []
    let tokenRequests = 0
    stub(calls, (url, _init, index) => {
      if (url.includes(SESSION_CONTEXT_METHOD)) {
        tokenRequests += 1
        return json({ message: { user: 'u', csrf_token: `tok-${tokenRequests}` } })
      }
      // The first write is rejected with a stale token, the replay succeeds.
      return index === 1 ? json(csrfRejected, 403) : json({ message: { saved: true } })
    })

    await expect(new FrappeRpcTransport('').call('app.method')).resolves.toEqual({ saved: true })
    // A fresh token request precedes the replay, so the replay is the last call.
    expect(tokenRequests).toBe(2)
    expect(calls.filter((call) => !call.url.includes(SESSION_CONTEXT_METHOD))).toHaveLength(2)
    const replay = calls[calls.length - 1]
    expect((replay.init.headers as Record<string, string>)['X-Frappe-CSRF-Token']).toBe('tok-2')
  })

  it('does not loop when the replay is rejected too', async () => {
    const calls: Call[] = []
    stub(calls, (url) => (url.includes(SESSION_CONTEXT_METHOD) ? json({ message: { user: 'u', csrf_token: 'tok' } }) : json(csrfRejected, 403)))

    await expect(new FrappeRpcTransport('').call('app.method')).rejects.toBeInstanceOf(FrontendError)
    expect(calls.filter((call) => !call.url.includes(SESSION_CONTEXT_METHOD))).toHaveLength(2)
  })

  it('never replays a permission rejection that is not about CSRF', async () => {
    const calls: Call[] = []
    stub(calls, (url) =>
      url.includes(SESSION_CONTEXT_METHOD)
        ? json({ message: { user: 'u', csrf_token: 'tok' } })
        : json({ exc_type: 'PermissionError', exception: 'frappe.exceptions.PermissionError: غير مسموح به' }, 403),
    )

    const error = await new FrappeRpcTransport('').call('app.method').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(FrontendError)
    expect((error as FrontendError).kind).toBe('permission')
    expect(calls.filter((call) => !call.url.includes(SESSION_CONTEXT_METHOD))).toHaveLength(1)
  })

  it('prefers the app-owned contract envelope over the HTTP status', async () => {
    const calls: Call[] = []
    stub(calls, (url) =>
      url.includes(SESSION_CONTEXT_METHOD)
        ? json({ message: { user: 'u', csrf_token: 'tok' } })
        : json({ supplier_payment_error: { code: 'not_found', message: 'المورد غير موجود', field: 'supplier' } }, 417),
    )

    const error = (await new FrappeRpcTransport('').call('app.method').catch((value: unknown) => value)) as FrontendError

    expect(error.kind).toBe('not_found')
    expect(error.message).toBe('المورد غير موجود')
    expect(error.field).toBe('supplier')
  })

  it('treats a denial on the session endpoint as signed-out, not forbidden', async () => {
    const calls: Call[] = []
    stub(calls, () => json({ exc_type: 'PermissionError', _server_messages: '["Login required"]' }, 403))

    const error = (await new FrappeRpcTransport('').sessionContext().catch((value: unknown) => value)) as FrontendError

    expect(error.kind).toBe('authentication')
    expect(error.status).toBe(403)
  })

  it('aborts a hung request instead of waiting forever', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: unknown, init: unknown) =>
          new Promise<Response>((_resolve, reject) => {
            ;((init as RequestInit).signal as AbortSignal | undefined)?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            )
          }),
      ),
    )

    const pending = new FrappeRpcTransport('')
      .call('app.method')
      .catch((value: unknown) => value as FrontendError) as Promise<FrontendError>
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 10)
    const error = await pending

    expect(error).toBeInstanceOf(FrontendError)
    expect(error.kind).toBe('network')
    expect(error.message).toBe('تأخر الخادم في الرد. حاول مرة أخرى.')
  })

  it('reports an incomplete response instead of returning undefined', async () => {
    const calls: Call[] = []
    stub(calls, (url) => (url.includes(SESSION_CONTEXT_METHOD) ? json({ message: { user: 'u', csrf_token: 'tok' } }) : json({})))

    await expect(new FrappeRpcTransport('').call('app.method')).rejects.toThrowError('استجابة الخادم غير مكتملة.')
  })

  it('reads the session identity with GET, never with a POST', async () => {
    const calls: Call[] = []
    stub(calls, () => json({ message: { user: 'operator@example.com', csrf_token: 'tok-session' } }))

    const context = await new FrappeRpcTransport('').sessionContext()

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain(SESSION_CONTEXT_METHOD)
    // Posting here answers 403 (wrong verb, not wrong permissions) and the shell would
    // then show the session gate over a perfectly valid session.
    expect(calls[0].init.method).toBe('GET')
    expect(context).toEqual({ user: 'operator@example.com', csrfToken: 'tok-session' })
  })

  it('reuses the token issued by that GET for the next write', async () => {
    const calls: Call[] = []
    stub(calls, (url) =>
      url.includes(SESSION_CONTEXT_METHOD) ? json({ message: { user: 'u', csrf_token: 'tok-from-get' } }) : json({ message: { ok: true } }),
    )

    const transport = new FrappeRpcTransport('')
    await transport.sessionContext()
    await transport.call('app.method', {})

    const headers = calls[1].init.headers as Record<string, string>
    expect(headers['X-Frappe-CSRF-Token']).toBe('tok-from-get')
  })

  it('maps a denied session GET to a sign-out rather than a permission failure', async () => {
    const calls: Call[] = []
    stub(calls, () => json({}, 403))

    const error = (await new FrappeRpcTransport('')
      .sessionContext()
      .catch((value: unknown) => value)) as FrontendError

    expect(error).toBeInstanceOf(FrontendError)
    expect(error.kind).toBe('authentication')
    expect(error.status).toBe(403)
  })

  it('never lets a cached session GET hand back a stale CSRF token', async () => {
    const calls: Call[] = []
    stub(calls, (url) => (url.includes(SESSION_CONTEXT_METHOD) ? json({ message: { user: 'u', csrf_token: 'tok' } }) : json(csrfRejected, 403)))

    await new FrappeRpcTransport('').call('app.method', {}).catch(() => undefined)

    const tokenCalls = calls.filter((call) => call.url.includes(SESSION_CONTEXT_METHOD))
    // bootstrap + the single retry after the CSRF rejection
    expect(tokenCalls).toHaveLength(2)
    for (const call of tokenCalls) {
      expect(call.init.method).toBe('GET')
      // Without these the browser would replay the previous session's token and every
      // write would answer 403 for good.
      expect(call.init.cache).toBe('no-store')
      expect(call.url).toMatch(/\?ts=\d+/)
    }
  })
})
