import {
  buildContentSecurityPolicy,
  FRAME_ANCESTORS_NONE,
} from '@web/config/content-security-policy';
import { CACHE_CONTROL, ROBOTS_DIRECTIVE } from '@web/constants/http';
import {
  PREVIEW_TOKEN_HEADER,
  PREVIEW_TOKEN_QUERY_PARAM,
} from '@web/server/draft-preview/constants/constants';
import { env } from '@web/utils/env/env';
import type { NextRequest, NextResponse } from 'next/server';

const toPlatformFrameAncestor = (): string =>
  env.PLATFORM_APP_URL
    ? new URL(env.PLATFORM_APP_URL).origin
    : FRAME_ANCESTORS_NONE;

const buildDraftPreviewHeaders = (): Record<string, string> => ({
  'Content-Security-Policy': buildContentSecurityPolicy(
    toPlatformFrameAncestor(),
  ),
  'Cache-Control': CACHE_CONTROL.PRIVATE_NO_STORE,
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': ROBOTS_DIRECTIVE.NOINDEX,
});

const buildRefusedPreviewHeaders = (): Record<string, string> => ({
  'Content-Security-Policy': buildContentSecurityPolicy(FRAME_ANCESTORS_NONE),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
});

/** `next.config` leaves these headers to the proxy on any request carrying a preview token, verified or not. */
export const applyPreviewResponseHeaders = (
  request: NextRequest,
  response: NextResponse,
): NextResponse => {
  if (!request.nextUrl.searchParams.has(PREVIEW_TOKEN_QUERY_PARAM)) {
    return response;
  }

  const headers = request.headers.has(PREVIEW_TOKEN_HEADER)
    ? buildDraftPreviewHeaders()
    : buildRefusedPreviewHeaders();
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
};
