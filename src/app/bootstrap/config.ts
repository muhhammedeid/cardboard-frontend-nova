export type ApiMode = 'mock' | 'real'

export interface FrontendConfig {
  apiBaseUrl: string
  apiMode: ApiMode
}

/** The environment fields this bundle reads (a subset of Vite's `ImportMetaEnv`). */
export interface FrontendEnvironment {
  VITE_API_MODE?: string
  VITE_API_BASE_URL?: string
  PROD?: boolean
}

/**
 * The runtime contract is identical to the previous frontend so the same
 * deployment/site configuration keeps working:
 *   VITE_API_MODE      -> 'real' (default) | 'mock'
 *   VITE_API_BASE_URL  -> '' for the same-host proxy / same-origin hosting
 */
export function getFrontendConfig(environment: FrontendEnvironment = import.meta.env): FrontendConfig {
  const apiMode = environment.VITE_API_MODE ?? 'real'
  if (apiMode !== 'mock' && apiMode !== 'real') {
    throw new Error('VITE_API_MODE must be mock or real')
  }
  // Fixture mode must never reach production: a bundle that silently serves demo
  // data is worse than a build that fails loudly.
  if (apiMode === 'mock' && environment.PROD) {
    throw new Error('VITE_API_MODE=mock is not allowed in a production build')
  }

  return { apiMode, apiBaseUrl: (environment.VITE_API_BASE_URL ?? '').replace(/\/$/, '') }
}

export function isMockRuntime(): boolean {
  return getFrontendConfig().apiMode === 'mock'
}
