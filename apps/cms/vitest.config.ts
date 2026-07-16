import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

// The only tests today are the pure migration-tooling helpers
// (scripts/migrate-lib.mjs) — plain Node scripts, not `src/**` app code, so
// the include pattern is overridden to point at scripts/ instead of the
// preset's default `src/**`.
export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      include: ['scripts/**/*.{test,spec}.mjs'],
    },
  }),
);
