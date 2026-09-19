# @blog/vitest-config

> Shared Vitest preset.

## What it provides

`preset.ts` — globals, the default test file glob, `css: false`, and the
React plugin. Consumers `mergeConfig` it with their own `vitest.config.ts`;
component packages (`ui`, `web`, `platform`) layer a `jsdom` environment and a
setup file on top, pure logic packages use it with `environment: 'node'`.

Also exports `createVitestConfig(overrides)`, the shared Next.js app preset
(SVGR, jsdom, the `next-intl` server-deps inline, and the node/jsdom project
split) that `apps/web` and `apps/platform` call directly instead of
`mergeConfig`-ing the base preset themselves, and `blogPackageAlias(pkg,
import.meta.url)`, a one-line builder for a `@blog/<pkg>/*` -> `packages/<pkg>/src`
resolve alias entry.

## Consumed by

`packages/ui`, `packages/service`, `packages/db`, `packages/config`,
`packages/auth`, `packages/studio`, `apps/web`, `apps/platform`. (`packages/utils`
configures Vitest directly rather than merging this preset.)

## Scripts

| Script | Command                                  |
| ------ | ---------------------------------------- |
| `lint` | `pnpm --filter @blog/vitest-config lint` |

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
