import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const dbSrc = fileURLToPath(new URL('../db/src', import.meta.url));
const configSrc = fileURLToPath(new URL('../config/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      mockReset: true,
      include: ['src/**/*.{test,spec}.ts'],
      env: {
        // env.ts validates at import time; SKIP_ENV_VALIDATION lets tests
        // import config/env modules without real Auth.js credentials set.
        SKIP_ENV_VALIDATION: 'true',
        // `buildAuthConfig` constructs `@blog/db`'s adapter eagerly (its
        // `getDb()` call, not the network connection), which needs a
        // syntactically valid connection string even under
        // SKIP_ENV_VALIDATION — the Neon driver parses this itself.
        DATABASE_URL: 'postgresql://user:pass@host/db',
      },
    },
    resolve: {
      alias: [
        { find: /^@blog\/auth\//, replacement: `${src}/` },
        { find: /^@blog\/db\//, replacement: `${dbSrc}/` },
        // Not imported directly by this package's own source — needed only
        // because @blog/db resolves to source, and its schema files import
        // @blog/config constants (same reason as the tsconfig.json mapping).
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
