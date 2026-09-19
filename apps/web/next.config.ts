import { createNextConfig } from '@blog/next-config/preset';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js App Router injects its own inline scripts on every page — the
// `self.__next_f.push(...)` RSC/hydration payload (and our inline dark-mode
// bootstrap). Their content is per-render, so it can't be hashed, and a
// per-request nonce would force dynamic rendering (we're static/ISR). So
// `script-src` allows 'unsafe-inline' (a hash/nonce would make the browser
// *ignore* it), plus 'unsafe-eval' in dev for Turbopack/HMR. Same-origin-only
// external scripts still apply, and every other directive stays strict.
//
// `va.vercel-scripts.com` is Vercel Speed Insights' script host. On an actual
// Vercel deployment the `<SpeedInsights />` component loads its script from a
// same-origin path (`/_vercel/speed-insights/script.js`, proxied by the
// platform), which `'self'` already covers — but in local dev (no proxy) it
// falls back to the real `va.vercel-scripts.com` debug script, so both
// `script-src` and `connect-src` (for the beacon it posts back) need the
// explicit allowance to keep dev usable without weakening prod.
const VERCEL_SPEED_INSIGHTS_ORIGIN = 'https://va.vercel-scripts.com';

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`
  : `script-src 'self' 'unsafe-inline' ${VERCEL_SPEED_INSIGHTS_ORIGIN}`;

// OAuth profile photos (`Avatar` in `AuthMenu`, a plain `<img>`, not
// `next/image` — this is a CSP concern, not `images.remotePatterns`):
// GitHub always serves from this one host, but Google has served profile
// photos from several `lhN.googleusercontent.com` subdomains over time, so a
// wildcard is pinned instead of one specific subdomain that could silently
// stop matching.
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io https://avatars.githubusercontent.com https://*.googleusercontent.com data:",
  scriptSrc,
  // 'unsafe-inline' is required because Next.js and Tailwind inject inline
  // <style> tags at runtime (e.g. Next's style-loader output, CSS-in-JS
  // from streamed RSC payloads); there is no static, hashable set of style
  // content to allow-list instead.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `connect-src 'self' https://cdn.sanity.io ${VERCEL_SPEED_INSIGHTS_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export default createNextConfig({
  contentSecurityPolicy,
  transpilePackages: [
    '@blog/ui',
    '@blog/service',
    '@blog/config',
    '@blog/email',
  ],
  images: {
    // This app never uses Next's static-image-import feature (all imagery
    // is remote Sanity CDN URLs via SanityImage) — disabling it removes
    // Next's own ambient `declare module '*.svg' { const content: any }`
    // shim (next/image-types/global.d.ts), which would otherwise conflict
    // with @blog/ui's typed SVGR declarations (svg.d.ts) for any .svg
    // import transitively type-checked through @blog/ui's source.
    disableStaticImages: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
});
