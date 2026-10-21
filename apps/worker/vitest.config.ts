import { fileURLToPath } from 'node:url';

import preset, { blogPackageAlias } from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      mockReset: true,
      env: { SKIP_ENV_VALIDATION: 'true' },
    },
    resolve: {
      alias: [
        {
          find: /^@worker\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        blogPackageAlias('db', import.meta.url),
        blogPackageAlias('email', import.meta.url),
        blogPackageAlias('insight', import.meta.url),
        blogPackageAlias('config', import.meta.url),
        blogPackageAlias('utils', import.meta.url),
        {
          find: /^server-only$/,
          replacement: fileURLToPath(
            new URL(
              '../../configs/vitest/server-only-stub.ts',
              import.meta.url,
            ),
          ),
        },
      ],
    },
  }),
);
