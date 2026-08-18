import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    // Admin tests can pull in @blog/ui's icon registry transitively (it
    // resolves to source, per the alias below), so it needs the same `.svg`
    // -> React component handling as packages/ui's own Vitest config.
    plugins: [
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
    ],
    resolve: {
      alias: [
        {
          find: /^@admin\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/db\//,
          replacement: `${fileURLToPath(new URL('../../packages/db/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/auth\//,
          replacement: `${fileURLToPath(new URL('../../packages/auth/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/insight\//,
          replacement: `${fileURLToPath(new URL('../../packages/insight/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/config\//,
          replacement: `${fileURLToPath(new URL('../../packages/config/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/ui\//,
          replacement: `${fileURLToPath(new URL('../../packages/ui/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/utils\//,
          replacement: `${fileURLToPath(new URL('../../packages/utils/src', import.meta.url))}/`,
        },
        // `import 'server-only'` throws outside a react-server bundle;
        // stub it to a no-op for the test env, same as packages/db and
        // apps/web.
        {
          find: /^server-only$/,
          replacement: fileURLToPath(
            new URL('./src/testing/server-only-stub.ts', import.meta.url),
          ),
        },
      ],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/vitest-setup.ts'],
      // next-intl's client `createNavigation` (`src/i18n/navigation.ts`)
      // ships pre-built ESM with no extension — Node's own ESM resolver
      // can't load that extensionless subpath when Vitest externalizes the
      // dependency. Inlining it forces Vite's bundler-style resolver
      // (which does resolve it) instead. Mirrors apps/web's identical
      // vitest config.
      server: {
        deps: {
          inline: ['next-intl'],
        },
      },
    },
  }),
);
