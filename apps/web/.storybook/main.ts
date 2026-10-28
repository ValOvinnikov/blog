import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

// `node:crypto` throws in the browser; stub `./encrypt-secret` for this importer only.
const encryptionIndexPath = fileURLToPath(
  new URL('../../../packages/utils/src/encryption/index.ts', import.meta.url),
);

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/modules/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      // Otherwise `.svg` resolves to a data URL and `<Icon>` throws; svgr owns it.
      image: {
        excludeFiles: ['**/*.svg'],
      },
    },
  },
  features: {
    experimentalRSC: true,
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    // `server-only` modules throw in a browser bundle, so each gets a stand-in.
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@web/server/newsletter/newsletter-actions/newsletter-actions':
        fileURLToPath(
          new URL('./mocks/newsletter-actions.ts', import.meta.url),
        ),
      '@web/server/newsletter/reader-subscription-status/reader-subscription-status':
        fileURLToPath(
          new URL('./mocks/reader-subscription-status.ts', import.meta.url),
        ),
      // The account-page sections' barrel drags this in alongside their pure views.
      '@web/server/auth/auth': fileURLToPath(
        new URL('./mocks/auth.ts', import.meta.url),
      ),
      // The error pages POST to `/api/client-log` on mount.
      '@web/utils/report-client-error': fileURLToPath(
        new URL('./mocks/report-client-error.ts', import.meta.url),
      ),
      // The index pages read the request context, which throws outside Next.
      '@web/server/request-context/request-context': fileURLToPath(
        new URL('./mocks/request-context.ts', import.meta.url),
      ),
      '@web/server/topic-index/get-topic-index-page/get-topic-index-page':
        fileURLToPath(
          new URL('./mocks/get-topic-index-page.ts', import.meta.url),
        ),
      '@web/server/tag-index/get-tag-index-page/get-tag-index-page':
        fileURLToPath(
          new URL('./mocks/get-tag-index-page.ts', import.meta.url),
        ),
    };
    const encryptSecretMockPath = fileURLToPath(
      new URL('./mocks/encrypt-secret.ts', import.meta.url),
    );
    config.plugins.push({
      name: 'stub-encryption-module',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === './encrypt-secret' && importer === encryptionIndexPath) {
          return encryptSecretMockPath;
        }
        return null;
      },
    });
    // Keep `viewBox`: `<Icon>` resizes the `<svg>` with CSS and crops without it.
    config.plugins.push(
      svgr({
        include: '**/*.svg',
        svgrOptions: {
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
      }),
    );
    return config;
  },
};
export default config;
