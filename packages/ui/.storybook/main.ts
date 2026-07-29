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
    config.plugins.push(svgr({ include: '**/*.svg' }));
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
