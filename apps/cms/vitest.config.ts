import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

// Split into two projects because only schema tests (src/**) import `sanity`
// directly (for `defineType`/`defineField`), whose main entry unconditionally
// imports a `.css` file that Node's native loader can't parse — inlining it
// routes the import through Vite's transform pipeline instead, where the
// shared preset's `css: false` strips it. Migration/script tests import
// `sanity/migrate`, which has no such CSS side effect, so paying to re-run
// the whole `sanity` graph through Vite per fork would be pure overhead.
export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [
        {
          find: /^@cms\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/config\//,
          replacement: `${fileURLToPath(new URL('../../packages/config/src', import.meta.url))}/`,
        },
      ],
    },
    test: {
      environment: 'node',
      projects: [
        {
          extends: true,
          test: {
            name: 'schema',
            include: ['src/**/*.{test,spec}.ts'],
            server: {
              deps: {
                inline: ['sanity'],
              },
            },
          },
        },
        {
          extends: true,
          test: {
            name: 'migrations',
            include: [
              'migrations/**/*.{test,spec}.ts',
              'scripts/**/*.{test,spec}.mjs',
            ],
            // `extends: true` concatenates `include` with the inherited
            // `src/**` pattern rather than replacing it; exclude src here so
            // schema tests don't also run (and pay the sanity inline) twice.
            exclude: ['src/**'],
          },
        },
      ],
    },
  }),
);
