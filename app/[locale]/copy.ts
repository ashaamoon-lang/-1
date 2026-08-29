/**
 * Homepage copy, exported so end-to-end tests can assert against the real
 * strings instead of hardcoding a duplicate.
 *
 * `e2e/agent-readiness.e2e.ts` and `e2e/instant-navigation.e2e.ts` both check
 * the homepage `<h1>`. The starter shipped those checks with its own brand
 * name inlined, which silently becomes wrong the moment a fork changes the
 * headline. Importing from here means changing the headline updates the tests
 * with it, and a genuinely missing or empty `<h1>` still fails them.
 */
export const HOME_HEADLINE = 'Commissioned work for people who notice'
