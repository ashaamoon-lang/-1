import s from './loading.module.css'

/**
 * The segment's loading fallback.
 *
 * No `<Wrapper>`: with `cacheComponents` this must be statically renderable,
 * and Wrapper mounts `<Theme>`, which reads uncached data and fails the
 * prerender. Keep it dependency-free.
 *
 * The styling lives in a CSS module rather than in utilities — see the note at
 * the top of `loading.module.css` for the measurement behind that.
 */
export default function Loading() {
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
