import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';

/**
 * Shared Vitest preset.
 *
 * Component packages (ui, web) merge this with a jsdom environment and a
 * setup file that loads `@testing-library/jest-dom`. Pure logic packages
 * (service) can use it as-is with the default `node` environment by passing
 * `environment: "node"`.
 *
 *   // packages/ui/vitest.config.ts
 *   import preset from "@blog/vitest-config/preset";
 *   import { mergeConfig, defineConfig } from "vitest/config";
 *   export default mergeConfig(preset, defineConfig({
 *     test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
 *   }));
 */
const preset = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    clearMocks: true,
    // Vitest's 5000ms default is crossed by real render-work tests (1.3-1.9s)
    // under root `pnpm test`'s parallel-turbo contention across packages.
    testTimeout: 20_000,
  },
});

export default preset;

export const blogPackageAlias = (pkg: string, importMetaUrl: string) => ({
  find: new RegExp(`^@blog/${pkg}/`),
  replacement: `${fileURLToPath(new URL(`../../packages/${pkg}/src`, importMetaUrl))}/`,
});

export type TNextAppVitestOverrides = Pick<ViteUserConfig, 'resolve'>;

export function createVitestConfig(overrides: TNextAppVitestOverrides) {
  return mergeConfig(
    preset,
    defineConfig({
      ...overrides,
      // web and platform can both pull in @blog/ui's icon registry
      // transitively (it resolves to source via the caller's own alias), so
      // both need the same `.svg` -> React component handling as
      // packages/ui's own Vitest config; `?url` isn't matched by this
      // filter, so it falls through to Vite's built-in asset-URL handling
      // untouched.
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
      test: {
        environment: 'jsdom',
        setupFiles: ['./src/vitest-setup.ts'],
        // next-intl's client `createNavigation` ships pre-built ESM with no
        // extension — Node's own ESM resolver can't load that extensionless
        // subpath when Vitest externalizes the dependency. Inlining it
        // forces Vite's bundler-style resolver (which does resolve it)
        // instead.
        server: {
          deps: {
            inline: ['next-intl'],
          },
        },
        // Constructing a jsdom environment is the single most expensive
        // thing this suite does — each isolated test file re-imports the
        // jsdom module (~1-10s), while the DOM it then builds costs ~0.2s.
        // Only the files that render need it, so `.ts` tests run on `node`
        // and `.tsx` tests on `jsdom`. The handful of `.ts` files that still
        // need a DOM opt back in with their own `@vitest-environment jsdom`
        // docblock.
        //
        // Split via `exclude`, not `include`: a project's `include` is
        // merged with the inherited one rather than replacing it, so an
        // `include` here would widen each project to the whole suite
        // instead of narrowing it.
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
}
