import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// Agent worktrees symlink their root node_modules to the primary checkout's
// copy (.husky/post-checkout), and Turbopack refuses to resolve through
// symlinks that leave its project root — including its `src/proxy.ts`
// detection, which silently finds nothing (no error, no locale rewrite) when
// the inferred root is wrong, rather than failing loudly. Anchor the root at
// the checkout that physically hosts the dependencies: in a shared-deps
// worktree that is the primary checkout (which also contains the worktree,
// under .claude/worktrees/); everywhere else realpath is the workspace root
// itself, i.e. the exact value Turbopack would infer on its own. Mirrors
// apps/web's identical fix.
//
// `../..` assumes apps/admin's current depth (repo root/apps/admin) —
// revisit if this app ever moves.
const workspaceRoot = resolve(process.cwd(), '../..');
const turbopackRoot = (() => {
  try {
    return dirname(realpathSync(join(workspaceRoot, 'node_modules')));
  } catch {
    return workspaceRoot; // no node_modules yet — nothing to resolve through
  }
})();

// Next.js App Router injects its own inline scripts on every page — the
// `self.__next_f.push(...)` RSC/hydration payload. Its content is
// per-render, so it can't be hashed or replaced with a static nonce ahead of
// time. So `script-src` allows 'unsafe-inline' (a hash/nonce would make the
// browser *ignore* it), plus 'unsafe-eval' in dev for Turbopack/HMR.
// Same-origin-only external scripts still apply, and every other directive
// stays strict.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

// No Sanity CDN images, no OAuth avatar rendering, and no external font or
// script origins load here today — every source below is 'self' (or
// 'none') for that reason, tighter than apps/web's equivalent policy.
// `img-src` additionally allows the Vercel Blob public storage host the Look
// tab's logo/favicon thumbnails load from — a public-access Blob store's
// pathname is per-store, not fixed, hence the wildcard subdomain.
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://*.blob.vercel-storage.com",
  scriptSrc,
  // 'unsafe-inline' is required because Next.js and Tailwind inject inline
  // <style> tags at runtime; there is no static, hashable set of style
  // content to allow-list instead.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Auth.js's built-in sign-in page (no custom `pages.signIn` is configured)
  // renders each OAuth provider as a same-origin <form>, which the app then
  // 302-redirects to the provider's authorize endpoint. Some browsers apply
  // `form-action` to that redirect target, not just the form's own `action`
  // attribute, so the provider origins have to be listed here even though the
  // submission itself is same-origin. apps/web never hits this path — its
  // sign-in menu calls next-auth/react's client `signIn()`, a fetch + JS
  // navigation, not a native form post.
  "form-action 'self' https://github.com https://accounts.google.com",
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
  // Next's own Server Action body-size cap defaults to 1 MB — well under the
  // Look tab's declared logo limit (`MAX_UPLOAD_BYTES.logo`, 4 MB in
  // `@admin/utils/brand-asset-limits`). Without raising it here, any upload
  // over ~1 MB never reaches `validateBrandAssetUpload` at all: Next's body
  // parser 413s first. Set with headroom above the 4 MB logo ceiling (not
  // an exact match) to absorb multipart/FormData framing overhead — keep
  // this above `MAX_UPLOAD_BYTES.logo` if that constant ever grows.
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
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
      // config in packages/ui, and apps/web's identical Turbopack rules.
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
  transpilePackages: ['@blog/ui'],
  images: {
    // Matches the CSP `img-src` allowance above: a public-access Vercel
    // Blob store's pathname is per-store, not fixed, hence the wildcard
    // subdomain rather than one pinned hostname.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
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
