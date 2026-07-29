import path from 'path';

import preset from '@blog/vitest-config/preset';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    // Bare `.svg` imports resolve to an SVGR React component; the `?url`
    // variant isn't matched by this filter, so it falls through to Vite's
    // built-in asset-URL handling untouched. Mirrors the Storybook
    // (.storybook/main.ts) and Turbopack (apps/web/next.config.ts) config.
    plugins: [svgr({ include: '**/*.svg' })],
    resolve: {
      alias: [
        {
          find: /^@blog\/ui\/(.+)/,
          replacement: `${path.resolve(__dirname, 'src')}/$1`,
        },
        {
          find: /^@blog\/config\/(.+)/,
          replacement: `${path.resolve(__dirname, '../config/src')}/$1`,
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
