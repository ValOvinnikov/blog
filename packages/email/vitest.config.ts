import preset, { blogPackageAlias } from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      env: {
        // env.ts validates at import time; SKIP_ENV_VALIDATION lets tests
        // import the env module without real Resend API keys set.
        SKIP_ENV_VALIDATION: 'true',
      },
    },
    resolve: {
      alias: [
        blogPackageAlias('email', import.meta.url),
        blogPackageAlias('config', import.meta.url),
        blogPackageAlias('utils', import.meta.url),
      ],
    },
  }),
);
