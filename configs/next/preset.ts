import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { buildFramingHeaders } from './security-headers';

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

const TRANSPORT_HEADERS = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
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

const ALL_PATHS = '/:path*';

const buildSecurityHeaderRules = (
  contentSecurityPolicy: string,
  proxyOwnsFramingForQueryParam: string | undefined,
) => {
  const framingHeaders = buildFramingHeaders(contentSecurityPolicy);
  if (!proxyOwnsFramingForQueryParam) {
    return [
      { source: ALL_PATHS, headers: [...framingHeaders, ...TRANSPORT_HEADERS] },
    ];
  }
  return [
    { source: ALL_PATHS, headers: TRANSPORT_HEADERS },
    {
      source: ALL_PATHS,
      missing: [{ type: 'query' as const, key: proxyOwnsFramingForQueryParam }],
      headers: framingHeaders,
    },
  ];
};

export type TNextConfigOverrides = Pick<
  NextConfig,
  'transpilePackages' | 'serverExternalPackages' | 'images' | 'experimental'
> & {
  contentSecurityPolicy: string;
  proxyOwnsFramingForQueryParam?: string;
};

export function createNextConfig(overrides: TNextConfigOverrides): NextConfig {
  const { contentSecurityPolicy, proxyOwnsFramingForQueryParam, ...appConfig } =
    overrides;

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
      return buildSecurityHeaderRules(
        contentSecurityPolicy,
        proxyOwnsFramingForQueryParam,
      );
    },
  };

  return withNextIntl(config);
}
