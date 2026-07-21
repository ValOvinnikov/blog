import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

// Tests here cover the pure migration-tooling helpers (scripts/migrate-lib.mjs),
// individual migrations' transform functions (migrations/**/index.test.ts),
// and schema-level validation logic co-located under src/** (e.g. a custom
// `rule.custom()` validator) — so the include pattern lists all three
// instead of relying on the preset's default `src/**` alone.
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
      include: [
        'src/**/*.{test,spec}.ts',
        'scripts/**/*.{test,spec}.mjs',
        'migrations/**/*.{test,spec}.ts',
      ],
    },
  }),
);
