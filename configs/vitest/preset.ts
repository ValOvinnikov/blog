import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig, mergeConfig } from 'vitest/config';

// The root entry loads every locale; `faker` there is this same English instance.
const FAKER_EN_ALIAS = {
  find: /^@faker-js\/faker$/,
  replacement: '@faker-js/faker/locale/en',
};

const preset = defineConfig({
  plugins: [react()],
  resolve: { alias: [FAKER_EN_ALIAS] },
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

type TAliasEntry = ReturnType<typeof blogPackageAlias>;

// server-only throws outside a react-server bundle; stub it to a no-op for tests — the real guard still runs at build time.
const SERVER_ONLY_STUB_ALIAS = {
  find: /^server-only$/,
  replacement: fileURLToPath(new URL('./server-only-stub.ts', import.meta.url)),
};

// vmThreads' CommonJS loader cannot require() ESM, which react-syntax-highlighter's CJS entry does with refractor.
const VM_SYNTAX_HIGHLIGHTER_ESM_ALIAS = {
  find: /^react-syntax-highlighter$/,
  replacement: 'react-syntax-highlighter/dist/esm/index.js',
};

const NODE_MODULES_GLOB = '**/node_modules/**';

const VM_WEB_STREAMS_SETUP = fileURLToPath(
  new URL('./vm-web-streams.ts', import.meta.url),
);

export type TNextAppVitestOverrides = {
  resolve: { alias: TAliasEntry[] };
};

export function createVitestConfig(overrides: TNextAppVitestOverrides) {
  return mergeConfig(
    preset,
    defineConfig({
      resolve: {
        alias: [...overrides.resolve.alias, SERVER_ONLY_STUB_ALIAS],
      },
      // @blog/ui ships raw .svg imports from source, so both apps' tests need the same SVGR handling as its own Vitest config.
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
        // next-intl's client createNavigation ships extensionless ESM that Vitest's default externalized resolver can't load — inline forces Vite's bundler resolver instead.
        server: {
          deps: {
            inline: ['next-intl'],
          },
        },
        // jsdom costs ~1-10s per file to construct, so only .tsx tests use it; exclude (not include, which would widen rather than narrow) splits by extension.
        projects: [
          {
            extends: true,
            test: {
              name: 'node',
              environment: 'node',
              pool: 'threads',
              exclude: [NODE_MODULES_GLOB, 'src/**/*.test.tsx'],
            },
          },
          {
            extends: true,
            test: {
              name: 'jsdom',
              // vmThreads keeps jsdom imported per worker but leaks memory across files, so a worker restarts past this measured limit.
              pool: 'vmThreads',
              vmMemoryLimit: '1024MB',
              setupFiles: [VM_WEB_STREAMS_SETUP],
              alias: [VM_SYNTAX_HIGHLIGHTER_ESM_ALIAS],
              exclude: [NODE_MODULES_GLOB, 'src/**/*.test.ts'],
            },
          },
        ],
      },
    }),
  );
}
