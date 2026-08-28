# @blog/prettier-config

> Shared Prettier configuration.

## What it provides

A single default export (`index.js`) with this repo's base formatting rules
(`singleQuote: true`). Each consumer's own `prettier.config.mjs` re-exports
it, optionally spreading in workspace-local overrides — e.g. `apps/web` and
`apps/platform` add the `prettier-plugin-tailwindcss` class-sorting plugin on
top.

## Consumed by

The repository root (`prettier.config.mjs`, used by the root `format` script
and the `lint-staged` pre-commit hook) and every package/app workspace's own
`prettier.config.mjs`: `packages/config`, `packages/utils`,
`packages/service`, `packages/db`, `packages/auth`, `packages/ui`,
`apps/web`, `apps/cms`, `apps/platform`.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
