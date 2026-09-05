'use client'

import { createContext, use, useEffect, useState } from 'react'

import type { Themes } from '@/styles/colors'
import { type ThemeName, themes } from '@/styles/config'

import s from './theme.module.css'

// Context state
export interface ThemeState {
  name: ThemeName
  theme: Themes[ThemeName]
}

// Context actions
export interface ThemeActions {
  setTheme: (theme: ThemeName) => void
}

// Context value shape
export type ThemeContextStandard = {
  state: ThemeState
  actions: ThemeActions
}

const ThemeContextInternal = createContext<ThemeContextStandard | null>(null)

/**
 * Hook to access the theme context with standard structure.
 * Returns { state, actions } for new implementations.
 *
 * @example
 * ```tsx
 * const { state, actions } = useTheme()
 * const { name, theme } = state
 * const { setTheme } = actions
 * ```
 */
export function useTheme(): ThemeContextStandard {
  const context = use(ThemeContextInternal)
  if (!context) {
    throw new Error('useTheme must be used within a Theme provider')
  }
  return context
}

export function Theme({
  children,
  theme,
  global,
}: {
  children: React.ReactNode
  theme: ThemeName
  global?: boolean
}) {
  // `currentTheme` defaults to the route's `theme` prop but can still be
  // overridden at runtime via the `setTheme` action. When the prop changes
  // (navigation), we re-sync *during render* — React's recommended replacement
  // for a setState-in-effect "mirror". This avoids the wasted extra render and
  // breaks the effect chain into the data-theme effect below.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [prevTheme, setPrevTheme] = useState(theme)
  if (theme !== prevTheme) {
    setPrevTheme(theme)
    setCurrentTheme(theme)
  }

  const contextValue: ThemeContextStandard = {
    state: {
      name: currentTheme,
      theme: themes[currentTheme],
    },
    actions: {
      setTheme: setCurrentTheme,
    },
  }

  /*
   * The document element is kept in step with the ground — but it is no
   * longer what decides the theme, and the difference matters.
   *
   * Before Tahap 43 this effect *was* the theme, which is why a route
   * declaring `theme="light"` shipped dark HTML and turned only after
   * hydration. The ground element below now carries the decision, rendered on
   * the server, so the page is correct with JavaScript switched off and there
   * is nothing to flash.
   *
   * What this still buys is the document canvas. `body` paints
   * `--color-primary`, and with `<html>` unthemed that resolves against the
   * un-themed defaults — so the canvas *behind* the opaque ground would be
   * the other theme's colour. A reader never sees it, but axe does: it falls
   * back to the document background when an element is off-screen, and it
   * measured the footer's wordmark at **1.08:1** against `#ffffff` on four
   * routes for exactly that reason.
   *
   * So: the ground is the theme, and this keeps the paper under it the same
   * colour. Never the other way round.
   */
  useEffect(() => {
    if (global) {
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  }, [currentTheme, global])

  const provided = (
    <ThemeContextInternal.Provider value={contextValue}>
      {children}
    </ThemeContextInternal.Provider>
  )

  /*
   * `global` now means "this owns the page's ground", and it renders an
   * element rather than writing to `<html>` — Tahap 43.
   *
   * The previous shape set `document.documentElement`'s attribute in an
   * effect, which runs after the first paint and does not run at all without
   * JavaScript. Measured across all five reachable routes: the server always
   * shipped `dark`, so `theme="light"` was a claim the document never
   * honoured. `docs/stages/TAHAP-43.md` §3.
   *
   * Rendering it means the correct theme is in the HTML itself, which is
   * what makes `theme-turn` free: the new route's ground arrives with the new
   * route's markup, already behind the page-transition overlay, so nothing
   * cross-fades and no element animates its own colour.
   *
   * `<html>` deliberately carries no `data-theme` any more:
   * `e2e/taste-preflight.e2e.ts` asserts exactly one distinct value per page,
   * and a stale default on the document element would be a second one.
   */
  if (!global) return provided

  return (
    <div data-theme={currentTheme} className={s.ground}>
      {provided}
    </div>
  )
}
