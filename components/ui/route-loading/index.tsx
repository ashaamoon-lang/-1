import s from './route-loading.module.css'

/**
 * The fallback a route shows while its dynamic part is still streaming.
 *
 * ## Why this is a component and not four copies of `loading.tsx`
 *
 * It used to be one `app/[locale]/loading.tsx`, which put a Suspense boundary
 * around **every** localized route — including the ones that read no request
 * data at all. The consequence was measured and much wider than the audit
 * first recorded: with JavaScript disabled, `/en`, `/id`, `/en/work` and every
 * project page rendered 28 characters — "Skip to main content Loading" — with
 * the real content sitting in the DOM inside a `<div hidden>` that only an
 * inline script reveals. The header was hidden too.
 *
 * Only routes that genuinely read request data need the boundary:
 * `work` (searchParams), and the three that read `draftMode()`. The home page
 * reads neither, so it is now prerendered whole and readable without
 * JavaScript — which is a roadmap §1.5 exit criterion that had been passing
 * only because the dataset used to be empty.
 *
 * ## No `<Wrapper>`
 *
 * With `cacheComponents` this must be statically renderable, and Wrapper
 * mounts `<Theme>`, which reads uncached data and fails the prerender. Keep it
 * dependency-free.
 */
export function RouteLoading() {
  return (
    // `<output>` carries an implicit role="status", so the role is redundant.
    <output aria-busy="true" className={s.loading}>
      <span className="sr-only">Loading</span>
      <div className={s.bars} aria-hidden="true">
        <div className={s.bar} />
        <div className={s.bar} />
        <div className={s.bar} />
      </div>
    </output>
  )
}
