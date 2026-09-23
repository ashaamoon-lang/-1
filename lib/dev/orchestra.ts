import type { StateStorage } from 'zustand/middleware'
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

type OrchestraState = Record<string, boolean>

const storageKey = 'orchestra'
/**
 * Nothing to persist to, for the half of this module's life that runs in
 * Node — Tahap 92.
 *
 * `createJSONStorage` calls its getter **immediately**, and this module is
 * imported statically by `lib/webgl/components/canvas`, so a bare
 * `localStorage` was read during prerender and while the server ran. Node 22
 * answers that with `ExperimentalWarning: localStorage is not available
 * because --localstorage-file was not provided` — five times in one build and
 * once per server start, measured.
 *
 * A typed stub rather than `undefined`: the panel's own reads then take the
 * same path in both environments, and nothing has to check whether its store
 * exists.
 */
const serverStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const Orchestra = createStore<OrchestraState>()(
  persist(
    subscribeWithSelector((): OrchestraState => ({})),
    {
      name: storageKey,
      storage: createJSONStorage(() =>
        // oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
        typeof window === 'undefined' ? serverStorage : window.localStorage
      ),
    }
  )
)

// Guard against double-registration on module re-evaluation (HMR, duplicate
// chunks) — without this a re-eval would stack a second 'storage' listener
// that's never removed. A `globalThis` flag (rather than a module-scope
// variable) is what actually survives re-evaluation, since a fresh module
// instance would otherwise reset a plain variable back to its initial value.
declare global {
  var __satusOrchestraStorageRegistered: boolean | undefined
}

if (
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
  typeof window !== 'undefined' &&
  !globalThis.__satusOrchestraStorageRegistered
) {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
      void Orchestra.persist.rehydrate()
    }
  })
  globalThis.__satusOrchestraStorageRegistered = true
}

export default Orchestra
