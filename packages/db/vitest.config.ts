import { fileURLToPath } from 'node:url';

import preset, { RESET_FILE_STATE_SETUP } from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const configSrc = fileURLToPath(new URL('../config/src', import.meta.url));
const insightSrc = fileURLToPath(new URL('../insight/src', import.meta.url));
const utilsSrc = fileURLToPath(new URL('../utils/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      pool: 'threads',
      // Off so a worker restores PGlite once for every file it runs; the setup file, the preset's reset/restore/unstub flags undo the module, global and spy state a file leaves behind.
      isolate: false,
      include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.ts'],
      globalSetup: ['./src/testing/global-setup.ts'],
      setupFiles: [
        RESET_FILE_STATE_SETUP,
        './src/testing/personal-data-keys-setup.ts',
      ],
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
        { find: /^@blog\/insight\//, replacement: `${insightSrc}/` },
        { find: /^@blog\/utils\//, replacement: `${utilsSrc}/` },
      ],
    },
  }),
);
