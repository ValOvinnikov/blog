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
    //
    // `vite-plugin-svgr` doesn't run SVGO by default (only the Turbopack
    // rule's `@svgr/webpack` loader in next.config.ts does), so this
    // `svgoConfig` is inert today — but SVGO's `preset-default` includes
    // `removeViewBox`, which strips `viewBox` whenever it's numerically
    // identical to the source file's own `width`/`height` (true of every
    // icon in packages/ui/src/assets/icons — they all ship `24x24`). That's
    // not actually redundant: `@blog/ui`'s `<Icon>` resizes the compiled
    // `<svg>` via CSS (`size-4`/`size-4.5`/`size-6`), and without a
    // `viewBox` the browser can't rescale the internal `<path>` coordinates
    // into the new box, so icons render cropped at every size but 24px.
    // Pinning the override here too keeps this entry point safe if SVGO is
    // ever turned on for it, and consistent with the Turbopack rule and
    // packages/ui's identical config.
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
              'prefixIds',
            ],
          },
        },
      }),
    );
    return config;
  },
};
export default config;
