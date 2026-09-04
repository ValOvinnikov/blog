import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

const utilsSrc = fileURLToPath(new URL('../utils/src', import.meta.url));

export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [{ find: /^@blog\/utils\//, replacement: `${utilsSrc}/` }],
    },
  }),
);
