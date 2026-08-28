# @blog/config

> Shared constants, URL builders, and generated Sanity types — the base of the dependency graph.

Every other workspace in this monorepo depends on `@blog/config`, and it
depends on nothing. It centralizes the values and shapes that must stay
identical across layers: UPPERCASE key/value constants (also referenced by
CMS schema `options.list` and migrations), the single URL-construction
source of truth (`routes`), shared TS types, and the Sanity typegen output
that gives every consumer end-to-end content types without hand-redeclaring
them.

## Layer contract

- **Depends on:** nothing (no workspace dependencies).
- **Consumed by:** `@blog/service`, `@blog/db`, `@blog/ui`, `apps/web`, `apps/cms`, `apps/platform`.
- **Never imports:** `@blog/service`, `@blog/ui`, or any app — enforced by
  `configs/eslint/no-upstream-imports.js` in this package's own
  `eslint.config.js`.

## Layout

- `constants/` — UPPERCASE key/value const pairs (`as const`), one file per
  domain (`link.ts`, `module.ts`, `size.ts`, `language.ts`, …), re-exported
  from `constants/index.ts`.
- `routes.ts` — the single source of truth for URL construction
  (`routes.post(slug)`, `routes.blogIndex(page?)`, …); co-located
  `routes.test.ts`.
- `types/` — shared TS types with no runtime behaviour.
- `client/objects.ts` — shared plain-object helpers.
- `utils.ts` — small standalone type helpers (e.g. `TValueOf<Obj>`).
- `react/polymorphic.ts` — the `TPolymorphicProps<C, OwnProps>` generic,
  exposed only via the `@blog/config/react` subpath so non-React consumers
  (like `@blog/service`) stay React-free.
- `sanity/generated/` — `schema.json` and `types.ts`, produced by
  `pnpm --filter cms typegen`. Never hand-edited — the next typegen run
  reverts a manual edit, and CI's typegen drift guard catches it.

Three `package.json` `exports` subpaths: `.` (the `src/index.ts` barrel —
constants, `routes`, generated Sanity types, shared types, `client/objects`,
`utils`), `./react` (the polymorphic helper, kept off the barrel), and
`./constants` (`constants/index.ts` directly).

## Scripts

| Script       | Command                                 |
| ------------ | --------------------------------------- |
| `lint`       | `pnpm --filter @blog/config lint`       |
| `type-check` | `pnpm --filter @blog/config type-check` |
| `format`     | `pnpm --filter @blog/config format`     |
| `test`       | `pnpm --filter @blog/config test`       |
| `test:watch` | `pnpm --filter @blog/config test:watch` |

Root-level `pnpm type-check` / `pnpm lint` / `pnpm test` run every
workspace's equivalent script through Turborepo, this one included.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
- [`../../docs/context/frontend-conventions.md`](../../docs/context/frontend-conventions.md) — dependency rules, type flow, per-workspace alias wiring.
