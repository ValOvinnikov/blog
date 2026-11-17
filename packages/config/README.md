# @shinefold/config

> Shared constants, URL builders, and generated Sanity types — near the base of the dependency graph.

Every other workspace in this monorepo depends on `@shinefold/config`. Its only
workspace upstream is `@shinefold/utils`, for the OKLCH maths behind the shared
contrast guard — imported by the `@shinefold/utils/color` subpath, never the root
barrel, which re-exports `node:crypto`-importing modules into every
consumer's graph, `@shinefold/ui` among them. It centralizes the values and
shapes that must stay identical across layers: UPPERCASE key/value constants
(also referenced by CMS schema `options.list` and migrations), the single
URL-construction source of truth (`routes`), shared TS types, and the Sanity
typegen output that gives every consumer end-to-end content types without
hand-redeclaring them.

## Layer contract

- **Depends on:** `@shinefold/utils`, via the `@shinefold/utils/color` subpath only
  (never the root barrel, which re-exports `node:crypto`-importing modules) —
  used for the OKLCH maths behind the shared contrast guard.
- **Consumed by:** `@shinefold/service`, `@shinefold/db`, `@shinefold/ui`, `@shinefold/studio`, `apps/web`, `apps/platform`.
- **Never imports:** `@shinefold/service`, `@shinefold/ui`, or any app — enforced by
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
  exposed only via the `@shinefold/config/react` subpath so non-React consumers
  (like `@shinefold/service`) stay React-free.
- `sanity/generated/` — `schema.json` and `types.ts`, produced by
  `pnpm --filter @shinefold/studio typegen`. Never hand-edited — the next typegen run
  reverts a manual edit, and CI's typegen drift guard catches it.

Three `package.json` `exports` subpaths: `.` (the `src/index.ts` barrel —
constants, `routes`, generated Sanity types, shared types, `client/objects`,
`utils`), `./react` (the polymorphic helper, kept off the barrel), and
`./constants` (`constants/index.ts` directly).

## Scripts

| Script       | Command                                      |
| ------------ | -------------------------------------------- |
| `lint`       | `pnpm --filter @shinefold/config lint`       |
| `type-check` | `pnpm --filter @shinefold/config type-check` |
| `format`     | `pnpm --filter @shinefold/config format`     |
| `gen:skins`  | `pnpm --filter @shinefold/config gen:skins`  |
| `test`       | `pnpm --filter @shinefold/config test`       |
| `test:watch` | `pnpm --filter @shinefold/config test:watch` |

`gen:skins` writes `formatSkinCss()`'s output to `configs/tailwind/skins.css`,
which `theme.css` imports, and `formatStorybookSkinCss()`'s to
`configs/tailwind/skins-storybook.css`, which only the Storybook previews
import. Run it after any palette or skin change: `skin-css.test.ts` fails
`pnpm test` while either checked-in file differs.

Root-level `pnpm type-check` / `pnpm lint` / `pnpm test` run every
workspace's equivalent script through Turborepo, this one included.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
- [`../../docs/context/frontend-conventions.md`](../../docs/context/frontend-conventions.md) — dependency rules, type flow, per-workspace alias wiring.
