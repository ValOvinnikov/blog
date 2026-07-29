import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

// main.ts is loaded as ESM (no __dirname/require), so resolve the src path
// via import.meta.url — see the ui-storybook skill.
const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    // Bare `.svg` imports resolve to an SVGR React component; the `?url`
    // variant isn't matched by this filter, so it falls through to Vite's
    // built-in asset-URL handling untouched. Mirrors the Vitest
    // (vitest.config.ts) and Turbopack (apps/web/next.config.ts) config.
    //
    // Every icon source ships an equal width/height/viewBox (e.g. 24x24), so
    // SVGO's default `removeViewBox` plugin treats the viewBox as redundant
    // and strips it — but it's only redundant at the source's native size.
    // Icon.tsx resizes compiled icons via CSS (size-4/size-4.5/size-6), which
    // needs the viewBox to rescale the SVG's internal coordinates; without it
    // the icon renders cropped at every size but native. Disable just that
    // SVGO plugin so compiled icons always keep their viewBox.
    config.plugins.push(
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
    );
    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
      jsxImportSource: 'react',
    };
    config.resolve = config.resolve ?? {};
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      {
        find: /^@blog\/ui\/(.+)/,
        replacement: `${srcDir}/$1`,
      },
    ];
    return config;
  },
};
export default config;
