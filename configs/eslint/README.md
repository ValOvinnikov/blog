# @blog/eslint-config

> Shared ESLint flat-config presets, one subpath per workspace layer.

## What it provides

- `base.js` — the root preset every layer preset extends: recommended JS/TS
  rules, `import-x`, Prettier compatibility, and `check-file`'s
  kebab-case filename enforcement.
- `no-upstream-imports.js` — the `no-restricted-imports` rule that enforces
  the dependency graph (e.g. blocking `@blog/config`/`@blog/utils` from
  importing `@blog/service`/`@blog/ui`).
- Per-layer subpaths that compose `base.js` (and, where relevant,
  `no-upstream-imports.js`) with that layer's own constraints — `./config`,
  `./utils`, `./service`, `./db`, `./ui`, `./web`, `./cms`, `./auth`,
  `./admin` — each imported by that workspace's own `eslint.config.js`.

## Consumed by

Every package and app workspace, plus `configs/tailwind` and
`configs/vitest`: `packages/config`, `packages/utils`, `packages/service`,
`packages/db`, `packages/auth`, `packages/ui`, `apps/web`, `apps/cms`,
`apps/admin`, `configs/tailwind`, `configs/vitest`.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
