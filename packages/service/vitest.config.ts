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
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_SANITY_DATASET: 'test',
      },
    },
    resolve: {
      alias: [{ find: /^#\//, replacement: `${src}/` }],
    },
  }),
);
