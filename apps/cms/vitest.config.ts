import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

// Tests here are the pure migration-tooling helpers (scripts/migrate-lib.mjs)
// and individual migrations' transform functions (migrations/**/index.test.ts)
// — neither lives under `src/**` app code, so the include pattern is
// overridden to point at scripts/ and migrations/ instead of the preset's
// default `src/**`.
export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      include: [
        'scripts/**/*.{test,spec}.mjs',
        'migrations/**/*.{test,spec}.ts',
      ],
    },
  }),
);
