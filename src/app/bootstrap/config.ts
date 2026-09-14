export type ApiMode = 'mock' | 'real'

export interface FrontendConfig {
  apiBaseUrl: string
  apiMode: ApiMode
}

/**
 * The runtime contract is identical to the previous frontend so the same
 * deployment/site configuration keeps working:
 *   VITE_API_MODE      -> 'real' (default) | 'mock'
 *   VITE_API_BASE_URL  -> '' for the same-host proxy / same-origin hosting
 */
export function getFrontendConfig(environment = import.meta.env): FrontendConfig {
  const apiMode = environment.VITE_API_MODE ?? 'real'
  if (apiMode !== 'mock' && apiMode !== 'real') {
    throw new Error('VITE_API_MODE must be mock or real')
  }

  return { apiMode, apiBaseUrl: (environment.VITE_API_BASE_URL ?? '').replace(/\/$/, '') }
}

export function isMockRuntime(): boolean {
  return getFrontendConfig().apiMode === 'mock'
}
