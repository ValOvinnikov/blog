import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
  stories: [
    '../src/app/**/*.stories.@(ts|tsx)',
    '../src/app/**/*.mdx',
    '../src/components/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  features: {
    experimentalRSC: true,
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    // web stories compose @blog/ui components (from source, per the pnpm
    // workspace link), so any story pulling in @blog/ui's icon registry
    // needs the same `.svg` -> React component handling as packages/ui's
    // own Storybook/Vitest config. Bare `.svg` imports resolve to an SVGR
    // component; `?url` isn't matched by this filter, so it falls through
    // to Vite's built-in asset-URL handling untouched.
    config.plugins.push(svgr({ include: '**/*.svg' }));
    return config;
  },
};
export default config;
