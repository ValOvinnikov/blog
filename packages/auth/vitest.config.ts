import { fileURLToPath } from 'node:url';

import preset from '@shinefold/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const dbSrc = fileURLToPath(new URL('../db/src', import.meta.url));
const configSrc = fileURLToPath(new URL('../config/src', import.meta.url));
const emailSrc = fileURLToPath(new URL('../email/src', import.meta.url));
const utilsSrc = fileURLToPath(new URL('../utils/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.{test,spec}.ts'],
      env: {
        // env.ts validates at import time; SKIP_ENV_VALIDATION lets tests
        // import config/env modules without real Auth.js credentials set.
        SKIP_ENV_VALIDATION: 'true',
        // `buildAuthConfig` constructs `@shinefold/db`'s adapter eagerly (its
        // `getDb()` call, not the network connection), which needs a
        // syntactically valid connection string even under
        // SKIP_ENV_VALIDATION — the Neon driver parses this itself.
        DATABASE_URL: 'postgresql://user:pass@host/db',
      },
    },
    resolve: {
      alias: [
        { find: /^@shinefold\/auth\//, replacement: `${src}/` },
        { find: /^@shinefold\/db\//, replacement: `${dbSrc}/` },
        { find: /^@shinefold\/config\//, replacement: `${configSrc}/` },
        { find: /^@shinefold\/email\//, replacement: `${emailSrc}/` },
        { find: /^@shinefold\/utils\//, replacement: `${utilsSrc}/` },
      ],
    },
  }),
);
