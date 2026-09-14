import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FrontendError } from '@/services/api/errors'

const { context } = vi.hoisted(() => ({ context: vi.fn() }))

vi.mock('@/services', () => ({ useServices: () => ({ session: { context } }) }))

import { useSessionStore } from './session'

beforeEach(() => {
  setActivePinia(createPinia())
  context.mockReset()
})

describe('session store', () => {
  it('reports the operator as signed in', async () => {
    context.mockResolvedValue({ user: 'Mohamed Eid', csrfToken: 'tok' })
    const store = useSessionStore()

    await store.load()

    expect(store.status).toBe('authenticated')
    expect(store.isSignedOut).toBe(false)
    expect(store.user).toBe('Mohamed Eid')
    expect(store.initials).toBe('ME')
  })

  it('distinguishes an expired session from an unreachable server', async () => {
    context.mockRejectedValueOnce(new FrontendError('authentication', 'يلزم تسجيل الدخول للمتابعة.', 403))
    const expired = useSessionStore()
    await expired.load()
    expect(expired.status).toBe('anonymous')
    expect(expired.isSignedOut).toBe(true)

    setActivePinia(createPinia())
    context.mockRejectedValueOnce(new FrontendError('network', 'تعذر الاتصال بالخادم.'))
    const offline = useSessionStore()
    await offline.load()
    // A network outage must never look like a signed-out operator.
    expect(offline.status).toBe('unreachable')
    expect(offline.isSignedOut).toBe(false)
    expect(offline.isUnreachable).toBe(true)
  })

  it('loads once until a reload is forced', async () => {
    context.mockResolvedValue({ user: 'u', csrfToken: 'tok' })
    const store = useSessionStore()

    await store.load()
    await store.load()
    expect(context).toHaveBeenCalledTimes(1)

    await store.load(true)
    expect(context).toHaveBeenCalledTimes(2)
  })

  it('recovers after a failed attempt', async () => {
    context.mockRejectedValueOnce(new FrontendError('network', 'تعذر الاتصال بالخادم.'))
    const store = useSessionStore()
    await store.load()
    expect(store.status).toBe('unreachable')

    context.mockResolvedValueOnce({ user: 'u', csrfToken: 'tok' })
    await store.load(true)
    expect(store.status).toBe('authenticated')
    expect(store.user).toBe('u')
  })
})
