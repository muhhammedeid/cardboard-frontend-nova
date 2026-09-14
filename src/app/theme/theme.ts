export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'nova-theme'
export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'] as const

export interface ThemeEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  root: { dataset: Record<string, string | undefined>; style: Record<string, unknown> }
  media: Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'> | null
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
}

/** No browser media query available (SSR/jsdom without a polyfill). */
function fallbackMedia(): NonNullable<ThemeEnvironment['media']> {
  return { matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }
}

export function readPreference(environment: ThemeEnvironment): ThemePreference {
  const stored = environment.storage?.getItem(THEME_STORAGE_KEY)
  return isThemePreference(stored) ? stored : 'system'
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

export function applyTheme(environment: ThemeEnvironment, preference: ThemePreference): ResolvedTheme {
  const media = environment.media ?? fallbackMedia()
  const resolved = resolveTheme(preference, media?.matches ?? false)
  environment.root.dataset.theme = resolved
  environment.root.dataset.themePreference = preference
  environment.root.style.colorScheme = resolved
  return resolved
}

export function createBrowserThemeEnvironment(): ThemeEnvironment {
  return {
    storage: typeof window === 'undefined' ? null : window.localStorage,
    root: document.documentElement as unknown as ThemeEnvironment['root'],
    media:
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : fallbackMedia(),
  }
}

/**
 * Owns the resolved theme for the whole app. The persisted preference is
 * frontend-only state; nothing about it is sent to the backend.
 */
export function createThemeController(environment: ThemeEnvironment = createBrowserThemeEnvironment()) {
  const preference = { value: readPreference(environment) }
  const resolved = { value: applyTheme(environment, preference.value) }

  const media = environment.media ?? fallbackMedia()
  const onSystemChange = () => {
    if (preference.value !== 'system') return
    resolved.value = applyTheme(environment, 'system')
  }
  media.addEventListener?.('change', onSystemChange)

  return {
    get preference(): ThemePreference {
      return preference.value
    },
    get resolved(): ResolvedTheme {
      return resolved.value
    },
    set(next: ThemePreference): void {
      preference.value = next
      environment.storage?.setItem(THEME_STORAGE_KEY, next)
      resolved.value = applyTheme(environment, next)
    },
    dispose(): void {
      media.removeEventListener?.('change', onSystemChange)
    },
  }
}

export type ThemeController = ReturnType<typeof createThemeController>
