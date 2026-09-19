import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Turbopack silently fails to resolve through the node_modules symlink agent worktrees use (.husky/post-checkout), so anchor at its realpath instead.
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
        // removeViewBox strips a viewBox equal to width/height (every icon here ships 24x24), which breaks @blog/ui's Icon CSS-based resizing — keep the rest of preset-default.
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
