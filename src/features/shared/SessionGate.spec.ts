import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SessionGate from './SessionGate.vue'
import { useSessionStore } from '@/app/stores/session'

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

const jsonResponse = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

function mountGate() {
  const session = useSessionStore()
  session.status = 'anonymous'
  session.user = ''
  return { wrapper: mount(SessionGate), session }
}

describe('SessionGate sign-in', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('signs the operator in from inside the app and re-reads the session', async () => {
    const fetchMock = vi.fn<FetchImpl>(async (input) => {
      const url = String(input)
      if (url.includes('/api/method/login')) {
        return jsonResponse(200, { message: 'Logged In', home_page: '/app/cardboard-management' })
      }
      return jsonResponse(200, { message: { user: 'operator@example.com' } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { wrapper } = mountGate()
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(2)
    await inputs[0].setValue('operator@example.com')
    await inputs[1].setValue('secret')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/method/login',
        expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
      )
    })
    expect(wrapper.find('[data-testid="session-gate-error"]').exists()).toBe(false)
  })

  it('shows the server sentence when the credentials are refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchImpl>(async () => jsonResponse(401, { message: 'Invalid login credentials' })),
    )

    const { wrapper, session } = mountGate()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('operator@example.com')
    await inputs[1].setValue('wrong-password')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="session-gate-error"]').text()).toBe(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      )
    })
    // A refused sign-in must not pretend the operator is in.
    expect(session.status).not.toBe('authenticated')
  })

  it('keeps the Desk login reachable for OTP and email-link sign-in', () => {
    const { wrapper } = mountGate()
    const link = wrapper.findAll('button').find((button) => button.text().includes('الدخول عبر صفحة النظام'))
    expect(link).toBeDefined()
  })
})
