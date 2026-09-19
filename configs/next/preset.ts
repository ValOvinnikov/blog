import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Agent worktrees symlink their root node_modules to the primary checkout's
// copy (.husky/post-checkout), and Turbopack refuses to resolve through
// symlinks that leave its project root — silently, with no error, rather
// than failing loudly (this also breaks apps/platform's `src/proxy.ts`
// locale detection). Anchor the root at the checkout that physically hosts
// the dependencies: in a shared-deps worktree that is the primary checkout
// (which also contains the worktree, under .claude/worktrees/); everywhere
// else realpath is the workspace root itself, i.e. the exact value Turbopack
// would infer on its own.
//
// `../..` assumes an app at `apps/<name>` (repo root/apps/<name>) — revisit
// if an app ever moves.
const workspaceRoot = resolve(process.cwd(), '../..');
const turbopackRoot = (() => {
  try {
    return dirname(realpathSync(join(workspaceRoot, 'node_modules')));
  } catch {
    return workspaceRoot;
  }
})();

const buildSecurityHeaders = (contentSecurityPolicy: string) => [
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

export type TNextConfigOverrides = Pick<
  NextConfig,
  'transpilePackages' | 'images' | 'experimental'
> & {
  contentSecurityPolicy: string;
};

export function createNextConfig(overrides: TNextConfigOverrides): NextConfig {
  const { contentSecurityPolicy, ...appConfig } = overrides;

  const config: NextConfig = {
    ...appConfig,
    turbopack: {
      root: turbopackRoot,
      rules: {
        // The glob below applies to any .svg import project-wide:
        //   import Sun from '.../sun.svg'        -> SVGR React component
        //   import SunUrl from '.../sun.svg?url' -> emitted asset URL
        // The two rules are disjoint on the `?url` query so exactly one
        // applies per import.
        //
        // SVGO's default `preset-default` includes `removeViewBox`, which
        // strips `viewBox` whenever it's numerically identical to the source
        // file's own `width`/`height` (true of every icon shipped from
        // source in this repo — they're all `24x24`). That's not actually
        // redundant: `@blog/ui`'s `<Icon>` resizes the compiled `<svg>` via
        // CSS (`size-4`/`size-4.5`/`size-6`), and without a `viewBox` the
        // browser can't rescale the internal `<path>` coordinates into the
        // new box, so icons render cropped at every size but 24px.
        // `@svgr/webpack`'s loader `options` map straight onto
        // `@svgr/core`'s `Config` (unlike `vite-plugin-svgr`, which nests
        // them under `svgrOptions`), so `svgoConfig` sits at the top level
        // here. Disabling just `removeViewBox` (keeping the rest of
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
    async headers() {
      return [
        {
          source: '/:path*',
          headers: buildSecurityHeaders(contentSecurityPolicy),
        },
      ];
    },
  };

  return withNextIntl(config);
}
