import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const utilsSrc = fileURLToPath(new URL('../utils/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      mockReset: true,
      env: {
        // env.ts validates at import time; SKIP_ENV_VALIDATION lets tests
        // import the env module without a real RESEND_API_KEY set.
        SKIP_ENV_VALIDATION: 'true',
      },
    },
    resolve: {
      alias: [
        { find: /^@blog\/email\//, replacement: `${src}/` },
        { find: /^@blog\/utils\//, replacement: `${utilsSrc}/` },
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
