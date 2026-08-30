import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

// Split into two projects because schema tests (src/**) always import
// `sanity` directly (for `defineType`/`defineField`), whose main entry
// unconditionally imports a `.css` file that Node's native loader can't
// parse — inlining it routes the import through Vite's transform pipeline
// instead, where the shared preset's `css: false` strips it. Most
// migration/script tests only import `sanity/migrate`, which has no such CSS
// side effect, but a migration test that imports a real schema type (e.g. via
// `assertSatisfiesRequiredFields`) pulls in the same `sanity` entry
// transitively, so the migrations project inlines it too.
//
// `sanity/structure`, `sanity-plugin-media`, `@sanity/vision` and
// `@sanity/code-input` pull in the Studio's UI dependency tree (including
// `@sanity-labs/ui-poc`'s bundled CSS) in a way `inline` alone doesn't
// resolve — `studio-config.test.ts`/`studio-mount.test.tsx` mock those
// modules instead of loading them for real.
export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [
        {
          find: /^@blog\/studio\//,
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
            include: ['src/**/*.{test,spec}.ts?(x)'],
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
            server: {
              deps: {
                inline: ['sanity'],
              },
            },
          },
        },
      ],
    },
  }),
);
