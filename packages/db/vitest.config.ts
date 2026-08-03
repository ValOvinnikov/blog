import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      mockReset: true,
      include: ['src/**/*.{test,spec}.ts'],
      env: {
        // `env.ts` validates at import time; SKIP_ENV_VALIDATION lets tests
        // import client/env modules without a real Neon connection string.
        SKIP_ENV_VALIDATION: 'true',
      },
    },
    resolve: {
      alias: [
        { find: /^@blog\/db\//, replacement: `${src}/` },
        // No `@blog/config` alias yet — nothing in this package imports it
        // (no feature tables/queries land in this bootstrap, #984). Add the
        // alias back here (and to tsconfig.json's `paths`, and `@blog/config:
        // workspace:*` to package.json) together with the first schema/query
        // file that actually needs it, per this repo's 1:1 alias↔dependency
        // convention.
        // `import 'server-only'` throws outside a react-server bundle; stub it
        // to a no-op for the node test env (the real guard still runs in build).
        {
          find: /^server-only$/,
          replacement: `${src}/testing/server-only-stub.ts`,
        },
      ],
    },
  }),
);
