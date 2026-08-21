# @blog/eslint-config

> Shared ESLint flat-config presets, one subpath per workspace layer.

## What it provides

- `base.js` — the root preset every layer preset extends: recommended JS/TS
  rules, `import-x`, Prettier compatibility, and `check-file`'s
  kebab-case filename enforcement.
- `no-upstream-imports.js` — the `no-restricted-imports` rule that enforces
  the dependency graph (e.g. blocking `@blog/config`/`@blog/utils` from
  importing `@blog/service`/`@blog/ui`).
- `no-prop-spread.js` — bans `{...rest}`/`{...props}` spread onto a JSX
  element in `@blog/ui` component source, with an explicit file allowlist
  for polymorphic components that forward props to a caller-chosen `as`
  element. `.test.tsx`/`.stories.tsx` files are out of scope — they spread
  fixtures onto local mock components, not `@blog/ui`'s own surface.
  Registered only in `ui.js`. Co-located `no-prop-spread.test.js`
  (`RuleTester`, run via `node --test`).
- `boolean-prop-prefix.js` — requires boolean-typed members of `T*Props`/
  `I*Props` declarations to start with `is`/`has`/`can`/`should`. A
  syntactic rule (no type-aware linting) scoped by the enclosing type's
  name, which is what keeps it from ever touching a `Result` discriminant's
  `ok`. Allowlists `prefetch`/`priority` (third-party passthrough).
  Registered in `ui.js`, `web.js`, and `admin.js`. Co-located
  `boolean-prop-prefix.test.js`. Known gap: a prop typed as an indexed
  access into a `tv()` variants type (e.g. `TFooVariants['bar']`) is boolean
  at runtime but isn't caught, since the rule only inspects the syntactic
  annotation shape — flagging it would require type-aware linting, which
  this repo's ESLint setup doesn't run.
- `func-style` — enforces arrow-function expressions (`'error', 'expression',
{ allowArrowFunctions: true }`) over function declarations. Registered only
  in `web.js`, scoped to `apps/web/**/*.{ts,tsx}`, with an override turning it
  back off in `**/page.tsx`, `**/layout.tsx`, `**/route.ts`, and
  `**/not-found.tsx` — Next.js reserved exports (`generateMetadata`, route
  verbs, …) stay as declarations.
- Per-layer subpaths that compose `base.js` (and, where relevant,
  `no-upstream-imports.js`) with that layer's own constraints — `./config`,
  `./utils`, `./insight`, `./service`, `./db`, `./ui`, `./web`, `./cms`,
  `./auth`, `./admin` — each imported by that workspace's own
  `eslint.config.js`. `./insight` composes `./utils` and exempts its own
  `src/**` from the repo-wide `no-console` ban — `files` patterns resolve
  relative to the consuming workspace, so workspace-specific `no-console`
  exemptions live in that layer's own preset, not in `base.js`: the insight
  logger, `db.js`'s `packages/db/scripts/**` and `drizzle.config.ts` (both
  standalone CLI tools where stdout is the interface), and `web.js`'s
  `apps/web/e2e/**`.

## Consumed by

Every package and app workspace, plus `configs/tailwind` and
`configs/vitest`: `packages/config`, `packages/utils`, `packages/insight`,
`packages/service`, `packages/db`, `packages/auth`, `packages/ui`,
`apps/web`, `apps/cms`, `apps/admin`, `configs/tailwind`, `configs/vitest`.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
