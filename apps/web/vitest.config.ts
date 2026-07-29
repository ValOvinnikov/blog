import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [
        {
          find: /^@web\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/ui\//,
          replacement: `${fileURLToPath(new URL('../../packages/ui/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/service\//,
          replacement: `${fileURLToPath(new URL('../../packages/service/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/config\//,
          replacement: `${fileURLToPath(new URL('../../packages/config/src', import.meta.url))}/`,
        },
      ],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/vitest-setup.ts'],
      // `SmartLink` renders next-intl's `Link`, whose client `createNavigation`
      // ships pre-built ESM (`import ... from 'next/navigation'` with no
      // extension) — Node's own ESM resolver can't load that extensionless
      // subpath when Vitest externalizes the dependency. Inlining it forces
      // Vite's bundler-style resolver (which does resolve it) instead.
      server: {
        deps: {
          inline: ['next-intl'],
        },
      },
    },
  }),
);
