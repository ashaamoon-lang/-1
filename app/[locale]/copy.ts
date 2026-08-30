import { resolveHomeContent } from '@/lib/content/home-fallback'

/**
 * Homepage copy, exported so end-to-end tests can assert against the real
 * strings instead of hardcoding a duplicate.
 *
 * `e2e/agent-readiness.e2e.ts` and `e2e/instant-navigation.e2e.ts` both check
 * the homepage `<h1>`. The starter shipped those checks with its own brand
 * name inlined, which silently becomes wrong the moment a fork changes the
 * headline. Deriving it here means changing the headline updates the tests
 * with it, and a genuinely missing or empty `<h1>` still fails them.
 *
 * Derived from the fallback rather than restated: the headline has one source
 * now, and it is the same one the page renders from. `/` redirects to `/en`,
 * so the English value is the one those tests will see — and the moment the
 * CMS carries a real headline, these tests are asserting a string the page no
 * longer shows. That is the point at which they should assert "an h1 with
 * text" instead, and this comment is the note to do it.
 */
export const HOME_HEADLINE = resolveHomeContent('en', null).headline
