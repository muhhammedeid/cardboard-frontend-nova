import { getFrontendConfig, type FrontendConfig } from '@/app/bootstrap/config'
import { createServices, type FrontendServices } from './services'

let cached: { config: FrontendConfig; services: FrontendServices } | undefined

/**
 * Composition accessor for route pages: `useServices()` returns the configured
 * feature services. Mock/real selection lives exclusively in
 * `app/bootstrap/config.ts` + `services.ts`, never in a component.
 */
export function useServices(): FrontendServices {
  const config = getFrontendConfig()
  if (!cached) cached = { config, services: createServices(config) }
  return cached.services
}

export function resetServices(): void {
  cached = undefined
}

export type { FrontendServices }
