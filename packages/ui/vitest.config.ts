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
    //
    // Every icon source ships an equal width/height/viewBox (e.g. 24x24), so
    // SVGO's default `removeViewBox` plugin treats the viewBox as redundant
    // and strips it — but it's only redundant at the source's native size.
    // Icon.tsx resizes compiled icons via CSS (size-4/size-4.5/size-6), which
    // needs the viewBox to rescale the SVG's internal coordinates; without it
    // the icon renders cropped at every size but native. Disable just that
    // SVGO plugin so compiled icons always keep their viewBox.
    plugins: [
      svgr({
        include: '**/*.svg',
        svgrOptions: {
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: { overrides: { removeViewBox: false } },
              },
            ],
          },
        },
      }),
    ],
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
        {
          find: /^@blog\/utils\/(.+)/,
          replacement: `${path.resolve(__dirname, '../utils/src')}/$1`,
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
