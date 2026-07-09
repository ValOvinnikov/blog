import preset from '@blog/vitest-config/preset';
import path from 'path';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [
        {
          find: /^@blog\/ui\/(.+)/,
          replacement: `${path.resolve(__dirname, 'src')}/$1`,
        },
      ],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
  }),
);
