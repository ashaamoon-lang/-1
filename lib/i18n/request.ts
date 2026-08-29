import { getRequestConfig } from 'next-intl/server'
import { locale as localeRootParam } from 'next/root-params'

import { isLocale, routing } from './routing'

/**
 * Per-request i18n configuration.
 *
 * Reads the locale from `next/root-params` rather than the `requestLocale`
 * argument, which next-intl deprecated in favour of root params. Root params
 * are statically analysable, which is what lets pages under `[locale]` stay
 * prerendered with `cacheComponents` enabled.
 *
 * The fallback is not defensive padding. next-intl's own docs note the
 * `[locale]` segment behaves like a catch-all for unknown paths, so this can
 * legitimately receive a value that is not a locale — and this repo serves
 * dotted Markdown aliases (`/en/work/x.md`) that make that more likely, not
 * less. An unknown value resolves to the default locale instead of throwing.
 */
export default getRequestConfig(async () => {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
