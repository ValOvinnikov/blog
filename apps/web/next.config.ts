import { createNextConfig } from '@blog/next-config/preset';
import { withBotId } from 'botid/next/config';

const isDev = process.env.NODE_ENV !== 'production';

// Next's per-render inline RSC payload can't be hashed, and a nonce would force dynamic rendering, so script-src needs 'unsafe-inline'.
// Speed Insights loads from a same-origin proxy on Vercel but from this host in local dev.
const VERCEL_SPEED_INSIGHTS_ORIGIN = 'https://va.vercel-scripts.com';

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`
  : `script-src 'self' 'unsafe-inline' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`;

// Google has served profile photos from several lhN.googleusercontent.com subdomains, hence the wildcard.
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io https://avatars.githubusercontent.com https://*.googleusercontent.com data:",
  scriptSrc,
  // Next.js and Tailwind inject per-render inline <style> tags, so there is no static set to hash.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `connect-src 'self' https://cdn.sanity.io ${VERCEL_SPEED_INSIGHTS_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

// withBotId wraps last: its own headers for the challenge path must follow, and so override, the site-wide CSP and X-Frame-Options.
export default withBotId(
  createNextConfig({
    contentSecurityPolicy,
    experimental: {
      // No single root layout exists to compose a 404 from: `<html lang>` is owned by `[tenant]/[locale]/layout.tsx`.
      globalNotFound: true,
    },
    transpilePackages: [
      '@blog/ui',
      '@blog/service',
      '@blog/config',
      '@blog/email',
    ],
    images: {
      // Next's static-image types declare `*.svg` as `any`, clashing with @blog/ui's typed SVGR declarations.
      disableStaticImages: true,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.sanity.io',
        },
      ],
    },
  }),
);
