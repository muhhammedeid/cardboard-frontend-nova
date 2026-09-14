import { describe, expect, it } from 'vitest'

import { getFrontendConfig, isMockRuntime } from './config'

describe('frontend configuration', () => {
  it('defaults to the real backend', () => {
    expect(getFrontendConfig({}).apiMode).toBe('real')
    expect(getFrontendConfig({}).apiBaseUrl).toBe('')
  })

  it('keeps the same-origin base url trimmed of a trailing slash', () => {
    expect(getFrontendConfig({ VITE_API_BASE_URL: 'https://erp.example.com/' }).apiBaseUrl).toBe('https://erp.example.com')
  })

  it('allows fixture mode in development only', () => {
    expect(getFrontendConfig({ VITE_API_MODE: 'mock' }).apiMode).toBe('mock')
    // The bundle this repository ships must never default to fixtures.
    expect(isMockRuntime()).toBe(false)
  })

  it('refuses to ship fixture data in a production build', () => {
    expect(() => getFrontendConfig({ VITE_API_MODE: 'mock', PROD: true })).toThrowError(
      'VITE_API_MODE=mock is not allowed in a production build',
    )
    expect(getFrontendConfig({ VITE_API_MODE: 'real', PROD: true }).apiMode).toBe('real')
  })

  it('rejects an unknown mode', () => {
    expect(() => getFrontendConfig({ VITE_API_MODE: 'demo' })).toThrowError('VITE_API_MODE must be mock or real')
  })
})
