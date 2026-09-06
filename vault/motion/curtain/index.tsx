import cn from 'clsx'

import s from './curtain.module.css'

/**
 * Curtain — the site's entrance, once per session.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Mount once in the root layout, as the first thing inside `<body>`.
 *
 * ```tsx
 * <body>
 *   <Curtain label={SITE.name} />
 *   …
 * ```
 *
 * ## What it is, and what it is deliberately not
 *
 * The earlier plan rejected a preloader in one sentence — *"delays content
 * for the sake of a loading animation"* — and that objection still stands.
 * This is the other thing:
 *
 * | | A preloader | This |
 * | --- | --- | --- |
 * | Content renders | after the loader finishes | **before the panel appears** |
 * | With JavaScript off | holds the page forever | **never renders at all** |
 * | If a font fails to load | hangs | **fixed ceiling, unaffected** |
 * | Progress number | usually fabricated | none |
 *
 * ## Zero JavaScript drives the animation, and that is a correction
 *
 * The plan had this lift on `document.fonts.ready` with a 900ms cap, so that
 * a page ready in 180ms would clear in 180ms. Two things were wrong with it.
 *
 * **It breaks without JavaScript.** A curtain lifted by script, in a browser
 * with script off, is a page that never appears — the most expensive failure
 * this component can have. `e2e/entrance.e2e.ts` puts that assertion first
 * for that reason.
 *
 * **Cancelling a running animation snaps.** If `fonts.ready` resolved after
 * the CSS fallback had already lifted the panel, replacing the animation with
 * a transition would drop the panel back to its start and lift it a second
 * time. That is a real defect traded for a few hundred milliseconds.
 *
 * So the whole thing is CSS with fixed timing, and there is no accelerator.
 * The side effect is better than the feature that was dropped: **an entrance
 * whose length never varies cannot tell the reader that the site was slow
 * today.** A curtain that is quick on fast connections and slow on bad ones
 * is a progress bar wearing a costume.
 *
 * ## Timing
 *
 * | Beat | Property | Duration | Curve |
 * | --- | --- | --- | --- |
 * | Hold | — | `--duration` | — |
 * | Wordmark out | `opacity` | `--duration-fast` | `--ease-out-quart` |
 * | Panel up | `transform` | `--duration` | `--ease-out-expo` |
 *
 * A fixed 1000ms, against the 1200ms ceiling the gate holds.
 *
 * **The wordmark leaves before the panel moves, and that is the whole idea.**
 * A black rectangle rising with a word inside it reads as an element sliding
 * away. A rectangle that is already empty when it starts to move reads as a
 * curtain. The 200ms between them is the only thing separating the two.
 *
 * **400ms to lift, not 800.** `vault/motion/page-transition` animates the
 * identical gesture — one viewport-height panel translating off the top edge
 * — at `var(--duration)` with `--ease-out-expo`. Shipping 800ms here would
 * give one physical movement two durations on one site, and the one standard
 * `CLAUDE.md` names is restraint applied consistently.
 *
 * ## Reduced motion
 *
 * `display: none`, and the node still ships. The motion preference is not in
 * the request, so the server cannot know it; deciding after hydration would
 * flash the curtain at exactly the reader who asked for no motion. The
 * element exists and is never painted — `docs/stages/TAHAP-48.md` §2.2 records
 * the distinction so it is not read as a loophole.
 */

/**
 * Marks the session before the panel paints, so a reload does not replay it.
 *
 * Inline and synchronous on purpose: it has to run *before* the browser
 * paints the element below it, which is the standard no-flash pattern. React
 * state cannot do this — it resolves after hydration, by which point the
 * curtain has already been on screen for a frame.
 *
 * `script-src` carries `'unsafe-inline'` as this project's documented base
 * policy (`lib/integrations/csp.ts` header comment — there is no nonce
 * pipeline), so this adds no new exposure. The `try/catch` is not decoration:
 * `sessionStorage` throws outright in some privacy modes, and an entrance
 * that can throw during document parse would take the page with it.
 */
const SESSION_SCRIPT =
  "try{if(sessionStorage.getItem('arth-entered'))document.documentElement.setAttribute('data-entered','');else sessionStorage.setItem('arth-entered','1')}catch(e){}"

/**
 * Hides the panel outright when scripts are off.
 *
 * The same idiom, and the same reason, as
 * `components/ui/command/index.tsx:106`: the rule has to reach markup that
 * JavaScript never touches, so it cannot live in the CSS module. `<noscript>`
 * rather than `@media (scripting: none)` because the media feature is not yet
 * universal and this is the one failure that must never happen.
 */
const NOSCRIPT_STYLE = '[data-curtain]{display:none!important}'

interface CurtainProps {
  /** The wordmark. `SITE.name` — never a second name for the studio. */
  label: string
}

export function Curtain({ label }: CurtainProps) {
  return (
    <>
      {/* oxlint-disable-next-line react/no-danger -- a static, self-authored string with no interpolation; it must run during document parse, which no React API can do */}
      <script dangerouslySetInnerHTML={{ __html: SESSION_SCRIPT }} />
      <noscript>
        {/* oxlint-disable-next-line react/no-danger -- a static, self-authored string; `style-src` carries 'unsafe-inline' as the documented base policy, and the rule must reach markup JavaScript never touches */}
        <style dangerouslySetInnerHTML={{ __html: NOSCRIPT_STYLE }} />
      </noscript>
      {/*
        `aria-hidden`, and it carries no information.

        The wordmark is already the first thing in the header, and a reader
        using a screen reader has heard it before the panel would have
        finished. Announcing it twice is noise; announcing it *first*, over
        the page title, is worse.
      */}
      <div data-curtain="" aria-hidden="true" className={s.curtain}>
        <span className={cn('h2', s.wordmark)}>{label}</span>
      </div>
    </>
  )
}
