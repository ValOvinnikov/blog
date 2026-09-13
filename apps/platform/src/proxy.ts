import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

export default createMiddleware(routing);

/**
 * Excludes dotted paths at the root only (`/favicon.ico`), never at depth.
 * next-intl's usual `.*\..*` exclusion also skips the Studio, whose structure
 * ids contain dots (`…page_post-provisioning.post.starter`) — and with
 * `localePrefix: 'never'`, a request that skips this middleware never gets
 * rewritten onto the `[locale]` tree, so it 404s on refresh.
 */
export const config = {
  matcher: '/((?!api|_next|_vercel|[^/]*\\.[^/]*$).*)',
};
