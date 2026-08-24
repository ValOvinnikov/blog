import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const configSrc = fileURLToPath(new URL('../config/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      mockReset: true,
      // `scripts/provision-tenant/**` is ops-script territory (not the
      // query-layer `src/`), but its request-shape and idempotency-skip
      // logic still gets the same unit-test coverage.
      include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.ts'],
      // Builds one migrated PGlite snapshot per vitest process; every query
      // test's `createTestDb()` restores from it instead of replaying all
      // migrations itself (see `src/testing/global-setup.ts`).
      globalSetup: ['./src/testing/global-setup.ts'],
      env: {
        // `env.ts` validates at import time; SKIP_ENV_VALIDATION lets tests
        // import client/env modules without a real Neon connection string.
        SKIP_ENV_VALIDATION: 'true',
      },
    },
    resolve: {
      alias: [
        { find: /^@blog\/db\//, replacement: `${src}/` },
        { find: /^@blog\/config\//, replacement: `${configSrc}/` },
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
