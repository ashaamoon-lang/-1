'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { CommandPaletteProps } from './palette'

import s from './command.module.css'

/**
 * The search trigger — the only part of the palette that ships to every route.
 *
 * ## Why this file is deliberately almost empty
 *
 * `e2e/route-budget.e2e.ts` measures `/en/practice/consulting` at 874 KB
 * against a 900 KB ceiling, and its own comment names those 26 KB as the ones
 * to watch. Base UI's Dialog, Autocomplete and ScrollArea do not fit in 26 KB.
 *
 * Raising the ceiling was permitted — the project owner freed the budget — but
 * raising a budget for weight that never had to load is how a budget stops
 * meaning anything. So the split is:
 *
 * - **here, on every route**: a button and one `keydown` listener, importing
 *   nothing from Base UI;
 * - **`./palette`, on first open**: everything else, through `next/dynamic`
 *   with `ssr: false`.
 *
 * `route-budget` measures after `networkidle` with no interaction, so if this
 * split is wrong, every route's number moves and the gate says so.
 *
 * ## Why the button exists at all
 *
 * A shortcut with no visible control is a feature for people who already know
 * it is there. This site's visitors are not developers. `docs/stages/TAHAP-28.md`
 * §1 records the decision: the shortcut is the accelerator, the button is the
 * door.
 *
 * ## Without JavaScript
 *
 * The header is a client component, so this button's markup is server-rendered
 * like the rest of it — and a button that renders without JavaScript and does
 * nothing when pressed is a lie the page tells. The `<noscript>` rule below
 * removes it in that case: no runtime cost, applied before hydration, and no
 * layout flash from a render-after-mount dance. The site stays fully navigable
 * without it, which is what `e2e/no-javascript.e2e.ts` protects.
 */

export function CommandTrigger({
  className,
}: {
  className?: string | undefined
}) {
  const t = useTranslations('search')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  /*
   * The palette's component, once it has been fetched — and a plain
   * `import()` in a handler rather than `next/dynamic` or `React.lazy`,
   * which is a measurement rather than a preference. See the note above.
   *
   * Once fetched it stays: unmounting would throw away the index the palette
   * fetched, and Base UI renders nothing while the dialog is closed.
   */
  const [Palette, setPalette] =
    useState<ComponentType<CommandPaletteProps> | null>(null)
  /*
   * Whether this open came from the keyboard with nothing focused.
   *
   * It decides where focus lands on close: normally Base UI returns it to
   * whatever was focused before, which is right when the reader pressed the
   * shortcut mid-page. But when nothing was focused, "before" is `<body>`,
   * and returning there strands a keyboard reader at the top of the document
   * with no position. In that one case focus is sent to this button instead.
   */
  const [returnToTrigger, setReturnToTrigger] = useState(false)

  const load = useCallback(async () => {
    const mod = await import('./palette')
    // The updater form: React would otherwise call a component passed to
    // `setState` as if it were a reducer.
    setPalette(() => mod.CommandPalette)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return

      event.preventDefault()
      setReturnToTrigger(document.activeElement === document.body)
      void load()
      setOpen((previous) => !previous)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [load])

  return (
    <>
      <noscript>
        <style
          // oxlint-disable-next-line react/no-danger -- a static, self-authored string with no interpolation; `style-src` carries 'unsafe-inline' as the documented base policy (lib/integrations/csp.ts). It cannot live in the CSS module: the rule has to reach markup that JavaScript never touches.
          dangerouslySetInnerHTML={{
            __html: '[data-search-trigger]{display:none!important}',
          }}
        />
      </noscript>

      <button
        ref={triggerRef}
        type="button"
        data-search-trigger=""
        // `MOTION-SPEC.md` §10 — the same grammar every other pressable noun
        // on this site speaks.
        data-press="nav"
        data-intent=""
        className={cn('caption', s.trigger, className)}
        onClick={() => {
          setReturnToTrigger(false)
          void load()
          setOpen(true)
        }}
      >
        <span aria-hidden="true" className={s.triggerIcon}>
          ⌕
        </span>
        <span className={s.triggerLabel}>{t('open')}</span>
        {/*
          The shortcut is shown, not hidden — it is how the button teaches the
          accelerator. `aria-hidden` because a screen reader announcing
          "Search command K" reads a decoration as part of the name; the
          button's accessible name stays the word.
        */}
        <kbd aria-hidden="true" className={s.triggerKey}>
          {t('shortcut')}
        </kbd>
      </button>

      {Palette && (
        <Palette
          open={open}
          onOpenChange={setOpen}
          finalFocus={returnToTrigger ? triggerRef : undefined}
        />
      )}
    </>
  )
}
