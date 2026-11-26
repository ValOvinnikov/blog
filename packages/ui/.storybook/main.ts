import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

// Loaded as ESM, so there is no __dirname to resolve from.
const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    // Icons are resized by CSS, which needs the viewBox SVGO strips by default.
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
        find: /^@shinefold\/ui\/(.+)/,
        replacement: `${srcDir}/$1`,
      },
    ];
    return config;
  },
};
export default config;
