import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

// `apps/web/src/i18n/request.ts` imports `deepMergePartial` from
// `@blog/utils`'s root barrel, which also re-exports this Node-only module
// (`import { createCipheriv } from 'node:crypto'` at module scope) — Vite's
// browser-external stub for `node:crypto` throws the instant that import is
// evaluated, so every story crashes via `experimentalRSC`'s App Router layout
// chain. This is the one file that re-exports it under this relative
// specifier, so `resolveId` below only intercepts imports of `./encrypt-secret`
// from this exact importer, rather than matching the bare specifier text
// globally the way `resolve.alias` would (`resolve.alias` matches on the
// specifier string alone, with no way to also constrain by importer).
const encryptionIndexPath = fileURLToPath(
  new URL('../../../packages/utils/src/encryption/index.ts', import.meta.url),
);

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/modules/**/*.stories.@(ts|tsx)',
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
      // `IdentitySection`/`NewsletterSection` (the account-page section
      // wrappers) import this. Their folder's barrel also re-exports the
      // pure view alongside the wrapper, so any story that pulls the view
      // in via the barrel (e.g. `AccountPageView`'s own fixtures) evaluates
      // the wrapper too, dragging this module along with it.
      '@web/server/auth/auth': fileURLToPath(
        new URL('./mocks/auth.ts', import.meta.url),
      ),
      // `ErrorPage`/`LocaleErrorPage`/`GlobalErrorPage` call this on mount,
      // which POSTs to `/api/client-log` via `sendBeacon`/`fetch` — aliasing
      // it keeps their stories from firing a real network request.
      '@web/utils/report-client-error': fileURLToPath(
        new URL('./mocks/report-client-error.ts', import.meta.url),
      ),
    };
    const encryptSecretMockPath = fileURLToPath(
      new URL('./mocks/encrypt-secret.ts', import.meta.url),
    );
    config.plugins.push({
      name: 'stub-encryption-module',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === './encrypt-secret' && importer === encryptionIndexPath) {
          return encryptSecretMockPath;
        }
        return null;
      },
    });
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
