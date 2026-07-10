import path from 'path';

import preset from '@blog/vitest-config/preset';
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
      css: {
        // `?raw` CSS imports (e.g. the design-token gallery's theme.css?raw)
        // must bypass Vitest's default CSS stubbing so the raw source text
        // is preserved; every other .css import stays stubbed for speed.
        include: [/\?raw/],
      },
    },
  }),
);
