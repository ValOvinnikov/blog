# @blog/tsconfig

> Shared base `tsconfig.json` `compilerOptions`.

## What it provides

`base.json` — `strict`, `noUncheckedIndexedAccess`, `target`/`module`/
`moduleResolution`, and the other repo-wide compiler options. Each
consumer's own `tsconfig.json` extends it (`"extends": "@blog/tsconfig/base.json"`)
and adds only its own `paths`.

## Consumed by

Every package and app workspace: `packages/config`, `packages/utils`,
`packages/service`, `packages/db`, `packages/auth`, `packages/ui`,
`apps/web`, `apps/cms`, `apps/platform`.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
