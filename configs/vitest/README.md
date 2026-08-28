# @blog/vitest-config

> Shared Vitest preset.

## What it provides

`preset.ts` — globals, the default test file glob, `css: false`, and the
React plugin. Consumers `mergeConfig` it with their own `vitest.config.ts`;
component packages (`ui`, `web`, `platform`) layer a `jsdom` environment and a
setup file on top, pure logic packages use it with `environment: 'node'`.

## Consumed by

`packages/ui`, `packages/service`, `packages/db`, `packages/config`,
`packages/auth`, `apps/web`, `apps/cms`, `apps/platform`. (`packages/utils`
configures Vitest directly rather than merging this preset.)

## Scripts

| Script | Command                                  |
| ------ | ---------------------------------------- |
| `lint` | `pnpm --filter @blog/vitest-config lint` |

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
