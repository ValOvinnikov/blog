import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { buildContentSecurityPolicy } from '@admin/utils/content-security-policy/content-security-policy';
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

const contentSecurityPolicy = buildContentSecurityPolicy({ isDev });

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
      // The glob below applies to any .svg import project-wide, so it
      // covers both @blog/ui's icon assets (packages/ui/src/assets/icons,
      // which ship from source via transpilePackages below) and admin's own
      // (src/assets/icons):
      //   import Sun from '.../sun.svg'        -> SVGR React component
      //   import SunUrl from '.../sun.svg?url' -> emitted asset URL
      // The two rules are disjoint on the `?url` query so exactly one
      // applies per import. Mirrors the Vitest/Storybook (vite-plugin-svgr)
      // config in packages/ui, and apps/web's identical Turbopack rules.
      //
      // SVGO's default `preset-default` includes `removeViewBox`, which
      // strips `viewBox` whenever it's numerically identical to the source
      // file's own `width`/`height` (true of every icon in both asset
      // directories — they all ship `24x24`). That's not actually
      // redundant: `Icon` resizes the compiled `<svg>` via CSS
      // (`size-4`/`size-4.5`/`size-6`), and without a
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
