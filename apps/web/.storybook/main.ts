import { fileURLToPath } from 'node:url';

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
    options: {
      // Without this, the framework's own image-asset Vite plugin (mimicking
      // Next's built-in image loader) also claims `.svg` imports, racing
      // `vite-plugin-svgr` below for the same files — Storybook warns about
      // exactly this ("you are not passing image include/exclude patterns to
      // the nextjs-vite plugin") on startup otherwise. The observed failure
      // mode: a bare `.svg` import (meant to resolve to an SVGR component,
      // per the `svgr()` config below) instead resolves to a raw
      // `data:image/svg+xml,...` URL string, so `@blog/ui`'s `<Icon>` throws
      // trying to `createElement` that string as a tag name. Excluding `.svg`
      // here leaves `vite-plugin-svgr` as the sole handler.
      image: {
        excludeFiles: ['**/*.svg'],
      },
    },
  },
  features: {
    experimentalRSC: true,
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    // `NewsletterForm` imports this `'use server'` action module, which
    // pulls in `@blog/db` (guarded by `server-only`) — that throws the
    // instant it's evaluated in a browser bundle. Aliasing the exact
    // specifier to a Storybook-only stand-in keeps the real module out of
    // this build entirely, same technique as `web-storybook`'s `@blog/service`
    // module-mock approach, scoped to just this one import path.
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@web/server/newsletter/newsletter-actions': fileURLToPath(
        new URL('./mocks/newsletter-actions.ts', import.meta.url),
      ),
    };
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
