import {
  GOOGLE_ANALYTICS_CONNECT_SOURCES,
  GOOGLE_ANALYTICS_IMG_SOURCES,
  GOOGLE_ANALYTICS_SCRIPT_SOURCES,
  PLAUSIBLE_ORIGIN,
} from './analytics-origins';

const isDev = process.env.NODE_ENV !== 'production';

// Next's per-render inline RSC payload can't be hashed, and a nonce would force dynamic rendering, so script-src needs 'unsafe-inline'.
// Speed Insights loads from a same-origin proxy on Vercel but from this host in local dev.
const VERCEL_SPEED_INSIGHTS_ORIGIN = 'https://va.vercel-scripts.com';

const ANALYTICS_SCRIPT_SOURCES = [
  VERCEL_SPEED_INSIGHTS_ORIGIN,
  PLAUSIBLE_ORIGIN,
  ...GOOGLE_ANALYTICS_SCRIPT_SOURCES,
].join(' ');

const ANALYTICS_CONNECT_SOURCES = [
  VERCEL_SPEED_INSIGHTS_ORIGIN,
  PLAUSIBLE_ORIGIN,
  ...GOOGLE_ANALYTICS_CONNECT_SOURCES,
].join(' ');

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ANALYTICS_SCRIPT_SOURCES}`
  : `script-src 'self' 'unsafe-inline' ${ANALYTICS_SCRIPT_SOURCES}`;

export const FRAME_ANCESTORS_NONE = "'none'";

export const buildContentSecurityPolicy = (
  frameAncestors: string,
  frameSources: readonly string[],
): string =>
  [
    "default-src 'self'",
    // Google has served profile photos from several lhN.googleusercontent.com subdomains, hence the wildcard.
    `img-src 'self' https://cdn.sanity.io https://avatars.githubusercontent.com https://*.googleusercontent.com https://*.blob.vercel-storage.com ${GOOGLE_ANALYTICS_IMG_SOURCES.join(' ')} data:`,
    scriptSrc,
    // Next.js and Tailwind inject per-render inline <style> tags, so there is no static set to hash.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `connect-src 'self' https://cdn.sanity.io ${ANALYTICS_CONNECT_SOURCES}`,
    `frame-src ${frameSources.join(' ')}`,
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
