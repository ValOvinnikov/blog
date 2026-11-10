import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const configSrc = fileURLToPath(new URL('../config/src', import.meta.url));
const utilsSrc = fileURLToPath(new URL('../utils/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      pool: 'vmThreads',
      mockReset: true,
      include: ['src/**/*.{test,spec}.ts'],
      env: {
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_SANITY_DATASET: 'test',
        // `env.ts` validates at import time; tests that delete env vars mid-run
        // (e.g. client.test.ts) rely on importing modules without throwing.
        SKIP_ENV_VALIDATION: 'true',
      },
    },
    resolve: {
      alias: [
        { find: /^@blog\/service\//, replacement: `${src}/` },
        { find: /^@blog\/config\//, replacement: `${configSrc}/` },
        { find: /^@blog\/utils\//, replacement: `${utilsSrc}/` },
      ],
    },
  }),
);
