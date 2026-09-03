import { fileURLToPath } from 'node:url';

import preset from '@blog/vitest-config/preset';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    // web tests can pull in @blog/ui's icon registry transitively (it
    // resolves to source, per the alias below), so it needs the same
    // `.svg` -> React component handling as packages/ui's own Vitest
    // config; `?url` isn't matched by this filter, so it falls through to
    // Vite's built-in asset-URL handling untouched.
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
              'prefixIds',
            ],
          },
        },
      }),
    ],
    resolve: {
      alias: [
        {
          find: /^@web\//,
          replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/ui\//,
          replacement: `${fileURLToPath(new URL('../../packages/ui/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/service\//,
          replacement: `${fileURLToPath(new URL('../../packages/service/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/db\//,
          replacement: `${fileURLToPath(new URL('../../packages/db/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/insight\//,
          replacement: `${fileURLToPath(new URL('../../packages/insight/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/auth\//,
          replacement: `${fileURLToPath(new URL('../../packages/auth/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/config\//,
          replacement: `${fileURLToPath(new URL('../../packages/config/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/utils\//,
          replacement: `${fileURLToPath(new URL('../../packages/utils/src', import.meta.url))}/`,
        },
        {
          find: /^@blog\/email\//,
          replacement: `${fileURLToPath(new URL('../../packages/email/src', import.meta.url))}/`,
        },
        // `import 'server-only'` throws outside a react-server bundle; stub it
        // to a no-op for the jsdom test env (the real guard still runs in the
        // Next.js build). Same pattern as packages/db and packages/service.
        {
          find: /^server-only$/,
          replacement: fileURLToPath(
            new URL('./src/testing/server-only-stub.ts', import.meta.url),
          ),
        },
      ],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/vitest-setup.ts'],
      // `SmartLink` renders next-intl's `Link`, whose client `createNavigation`
      // ships pre-built ESM (`import ... from 'next/navigation'` with no
      // extension) — Node's own ESM resolver can't load that extensionless
      // subpath when Vitest externalizes the dependency. Inlining it forces
      // Vite's bundler-style resolver (which does resolve it) instead.
      server: {
        deps: {
          inline: ['next-intl'],
        },
      },
      // Constructing a jsdom environment is the single most expensive thing
      // this suite does — each isolated test file re-imports the jsdom module
      // (~1-10s), while the DOM it then builds costs ~0.2s. Only the files
      // that render need it, so `.ts` tests run on `node` and `.tsx` tests on
      // `jsdom`. The handful of `.ts` files that still need a DOM opt back in
      // with their own `@vitest-environment jsdom` docblock.
      //
      // Split via `exclude`, not `include`: a project's `include` is merged
      // with the inherited one rather than replacing it, so an `include` here
      // would widen each project to the whole suite instead of narrowing it.
      projects: [
        {
          extends: true,
          test: {
            name: 'node',
            environment: 'node',
            exclude: ['**/node_modules/**', 'src/**/*.test.tsx'],
          },
        },
        {
          extends: true,
          test: {
            name: 'jsdom',
            exclude: ['**/node_modules/**', 'src/**/*.test.ts'],
          },
        },
      ],
    },
  }),
);
