import { afterEach, describe, expect, it, vi } from 'vitest'

import { login } from './auth'
import { FrontendError } from './errors'

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function stubFetch(impl: FetchImpl) {
  const mock = vi.fn<FetchImpl>(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

const jsonResponse = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

describe('in-app login', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts the operator credentials to Frappe and reads the session back', async () => {
    const fetchMock = stubFetch(async () =>
      jsonResponse(200, { message: 'Logged In', home_page: '/app/cardboard-management', full_name: 'Mohamed Eid' }),
    )

    const result = await login({ email: '  user@example.com ', password: 'secret' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/method/login')
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('same-origin')
    expect(JSON.parse(String(init?.body))).toEqual({ usr: 'user@example.com', pwd: 'secret' })
    expect(result).toEqual({
      user: 'user@example.com',
      fullName: 'Mohamed Eid',
      homePage: '/app/cardboard-management',
    })
  })

  it('turns a rejected login into the operator sentence, never Frappe English', async () => {
    stubFetch(async () =>
      jsonResponse(401, { message: 'Invalid login credentials', exc_type: 'AuthenticationError' }),
    )

    const error = (await login({ email: 'user@example.com', password: 'wrong' }).catch(
      (value: unknown) => value,
    )) as FrontendError

    expect(error).toBeInstanceOf(FrontendError)
    expect(error.kind).toBe('authentication')
    expect(error.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.')
    expect(error.message).not.toMatch(/Invalid login/)
  })

  it('refuses an empty submission without touching the network', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, {}))

    await expect(login({ email: '   ', password: '' })).rejects.toThrow('أدخل البريد الإلكتروني وكلمة المرور.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports an unreachable backend as a network failure', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = (await login({ email: 'user@example.com', password: 'secret' }).catch(
      (value: unknown) => value,
    )) as FrontendError

    expect(error.kind).toBe('network')
    expect(error.message).toContain('تعذر الاتصال بالخادم')
  })
})
