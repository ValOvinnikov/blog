import { rememberSignupPromo } from '@platform/server/proxy/remember-signup-promo/remember-signup-promo';
import {
  REQUESTED_PATH_HEADER,
  toRequestedPath,
} from '@platform/utils/requested-path/requested-path';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  request.headers.set(REQUESTED_PATH_HEADER, toRequestedPath(request.nextUrl));

  const response = handleI18nRouting(request);
  rememberSignupPromo(request, response);

  return response;
}

// Root-level dotted paths only: Studio structure ids contain dots, and a skipped request is never rewritten onto `[locale]`.
// The UUID is BotID's fixed path prefix, which `[locale]` would otherwise swallow.
export const config = {
  matcher:
    '/((?!api|_next|_vercel|icon|apple-icon|149e9513-01fa-4fb0-aad4-566afd725d1b|[^/]*\\.[^/]*$).*)',
};
