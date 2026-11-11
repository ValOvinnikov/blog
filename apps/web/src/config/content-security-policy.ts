const isDev = process.env.NODE_ENV !== 'production';

// Next's per-render inline RSC payload can't be hashed, and a nonce would force dynamic rendering, so script-src needs 'unsafe-inline'.
// Speed Insights loads from a same-origin proxy on Vercel but from this host in local dev.
const VERCEL_SPEED_INSIGHTS_ORIGIN = 'https://va.vercel-scripts.com';

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`
  : `script-src 'self' 'unsafe-inline' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`;

export const FRAME_ANCESTORS_NONE = "'none'";

export const buildContentSecurityPolicy = (frameAncestors: string): string =>
  [
    "default-src 'self'",
    // Google has served profile photos from several lhN.googleusercontent.com subdomains, hence the wildcard.
    "img-src 'self' https://cdn.sanity.io https://avatars.githubusercontent.com https://*.googleusercontent.com https://*.blob.vercel-storage.com data:",
    scriptSrc,
    // Next.js and Tailwind inject per-render inline <style> tags, so there is no static set to hash.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `connect-src 'self' https://cdn.sanity.io ${VERCEL_SPEED_INSIGHTS_ORIGIN}`,
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
