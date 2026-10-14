import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

export default createMiddleware(routing);

// Root-level dotted paths only: Studio structure ids contain dots, and a skipped request is never rewritten onto `[locale]`.
export const config = {
  matcher: '/((?!api|_next|_vercel|[^/]*\\.[^/]*$).*)',
};
