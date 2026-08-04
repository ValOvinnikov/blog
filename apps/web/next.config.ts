import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// Agent worktrees symlink their root node_modules to the primary checkout's
// copy (.husky/post-checkout), and Turbopack refuses to resolve through
// symlinks that leave its project root. Anchor the root at the checkout that
// physically hosts the dependencies: in a shared-deps worktree that is the
// primary checkout (which also contains the worktree, under
// .claude/worktrees/); everywhere else realpath is the workspace root itself,
// i.e. the exact value Turbopack would infer on its own.
//
// `../..` assumes apps/web's current depth (repo root/apps/web) — revisit if
// this app ever moves.
const workspaceRoot = resolve(process.cwd(), '../..');
const turbopackRoot = (() => {
  try {
    return dirname(realpathSync(join(workspaceRoot, 'node_modules')));
  } catch {
    return workspaceRoot; // no node_modules yet — nothing to resolve through
  }
})();

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

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const config: NextConfig = {
  turbopack: {
    root: turbopackRoot,
    rules: {
      // @blog/ui's icon assets (packages/ui/src/assets/icons) ship from
      // source (transpilePackages below), so Turbopack sees their raw .svg
      // imports directly:
      //   import Sun from '.../sun.svg'        -> SVGR React component
      //   import SunUrl from '.../sun.svg?url' -> emitted asset URL
      // The two rules are disjoint on the `?url` query so exactly one
      // applies per import. Mirrors the Vitest/Storybook (vite-plugin-svgr)
      // config in packages/ui.
      //
      // SVGO's default `preset-default` includes `removeViewBox`, which
      // strips `viewBox` whenever it's numerically identical to the source
      // file's own `width`/`height` (true of every icon in
      // packages/ui/src/assets/icons — they all ship `24x24`). That's not
      // actually redundant: `@blog/ui`'s `<Icon>` resizes the compiled
      // `<svg>` via CSS (`size-4`/`size-4.5`/`size-6`), and without a
      // `viewBox` the browser can't rescale the internal `<path>`
      // coordinates into the new box, so icons render cropped at every size
      // but 24px. `@svgr/webpack`'s loader `options` map straight onto
      // `@svgr/core`'s `Config` (unlike `vite-plugin-svgr`, which nests them
      // under `svgrOptions`), so `svgoConfig` sits at the top level here.
      // Disabling just `removeViewBox` (keeping the rest of
      // `preset-default`, plus `prefixIds`, which SVGR's own svgo plugin
      // always runs alongside it) preserves every other optimization.
      '*.svg': [
        {
          condition: { query: /^\?url$/ },
          type: 'asset',
        },
        {
          condition: { not: { query: /^\?url$/ } },
          loaders: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: { overrides: { removeViewBox: false } },
                    },
                    'prefixIds',
                  ],
                },
              },
            },
          ],
          as: '*.js',
        },
      ],
    },
  },
  transpilePackages: ['@blog/ui', '@blog/service', '@blog/config'],
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(config);
