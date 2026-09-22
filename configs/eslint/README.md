# @blog/eslint-config

> Shared ESLint flat-config presets, one subpath per workspace layer.

## What it provides

- `base.js` — the root preset every layer preset extends: recommended JS/TS
  rules, `import-x`, Prettier compatibility, and `check-file`'s
  kebab-case filename enforcement.
- `no-upstream-imports.js` — the `no-restricted-imports` rule that enforces
  the dependency graph (e.g. blocking `@blog/config`/`@blog/utils` from
  importing `@blog/service`/`@blog/ui`). It's generic and unscoped by file
  path, so it only covers bans that apply everywhere it's spread in. The
  `@blog/db` → `@blog/auth` layering (db must never import auth; auth
  legitimately imports db, so it's one-directional, not mutual) is
  package-specific and lives directly in `db.js` instead — with
  `db.test.js` covering the ban and `auth.test.js` covering that the
  reverse import stays unrestricted.
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
  Registered in `ui.js`, `web.js`, and `platform.js`. Co-located
  `boolean-prop-prefix.test.js`. Known gap: a prop typed as an indexed
  access into a `tv()` variants type (e.g. `TFooVariants['bar']`) is boolean
  at runtime but isn't caught, since the rule only inspects the syntactic
  annotation shape — flagging it would require type-aware linting, which
  this repo's ESLint setup doesn't run.
- `no-class-assertions.js` — bans asserting a DOM class in a test:
  `toHaveClass`/`.not.toHaveClass`, `toHaveAttribute('class', …)`,
  `getAttribute('class')`, and reads of `.className`/`.classList`. Registered
  in `base.js` under its own `blog-test` plugin namespace (not `blog` —
  `ui.js`/`web.js`/`platform.js` already register `blog` over the broader
  `**/*.{ts,tsx}`, and ESLint's flat-config plugin merge throws
  `Cannot redefine plugin` when two matching config objects register the same
  plugin key with a different rules object), scoped to `**/*.test.{ts,tsx}`
  so it applies to every workspace. Co-located `no-class-assertions.test.js`.
  Per `testing-practices` → "What not to test": assert the semantic
  observable instead, or cover styling in a story with `no-tests-needed`.
  Known gap: it flags any `.className`/`.classList` member read in a test
  file, not only inside `expect(…)`, and can't see a class asserted
  indirectly through `objectContaining` in a `toHaveBeenCalledWith`.

  Pre-existing violations in `packages/ui`, `apps/web`, and `apps/platform`
  were baselined via ESLint's bulk-suppressions feature
  (`eslint-suppressions.json` at each workspace root) while sweep tickets
  drained them; epics #3461 and #3522 finished that drain, and no
  `eslint-suppressions.json` file remains anywhere in the repo — the rule is
  enforced from a clean baseline in every workspace. The bulk-suppressions
  mechanism itself is still worth knowing: if a baseline is ever
  reintroduced, fixing a suppressed violation without pruning its entry
  (`eslint . --prune-suppressions`) makes ESLint exit non-zero with an
  "unused suppressions" error.

- `eslint-plugin-testing-library` — registered in `base.js`'s
  `**/*.test.{ts,tsx}` override alongside `blog-test/no-class-assertions`,
  with exactly three rules as `error` (no `recommended` preset):
  `testing-library/no-container` bans `container.querySelector`/
  `container.querySelectorAll` in favor of a `screen` query;
  `testing-library/no-node-access` bans reaching into the DOM/React-element
  tree with `.parentElement`/`.closest()`/`.children`/`.firstChild` and
  similar — known gap (#3561): it flags a bare node-property access
  (`container.children`, `el.firstChild`) but not a chained one
  (`container.children[0]`, `el.firstChild.textContent`), since the rule
  skips a property access that is itself the object of another; the chained
  form is caught in review instead (`code-review-practices` §0);
  `testing-library/prefer-screen-queries` bans destructuring a
  query off `render()`'s return value instead of using `screen`.

  The plugin's "which calls count as a render" detection is aggressive
  (name-based: any identifier containing `render`) by default, but this
  repo's `setup(...)` helper convention (a curried `customRender`/
  `customRenderAsync` factory bound to `setup` — see each workspace's
  `src/testing/custom-render.tsx`) doesn't contain `render` and is invisible
  to it. The `testing-library/custom-renders` setting fixes that, but
  switches the aggressive name heuristic off entirely in favour of an exact
  list — so every render helper actually called directly in a test file has
  to be listed, not just `setup`: `customRender`, `customRenderAsync`,
  `renderElement`, `renderWithIntl`. (A local helper that only wraps one of
  these — e.g. a per-file `renderHydrated` — needs no separate entry; the
  wrapped call is what the rule sees.) Verify any change to this list by
  editing it and running `pnpm lint` from root — it should stay green.

  Pre-existing violations in `packages/ui`, `apps/web`, and `apps/platform`
  were baselined the same way as `no-class-assertions` while epics #3461
  and #3522 drained them; that drain is complete, no
  `eslint-suppressions.json` file remains anywhere in the repo, and all
  three rules are enforced from a clean baseline in every workspace.

- `func-style` — enforces arrow-function expressions (`'error', 'expression',
{ allowArrowFunctions: true }`) over function declarations. Registered only
  in `web.js`, scoped to `apps/web/**/*.{ts,tsx}`, with an override turning it
  back off in `**/page.tsx`, `**/layout.tsx`, `**/route.ts`, and
  `**/not-found.tsx` — Next.js reserved exports (`generateMetadata`, route
  verbs, …) stay as declarations.
- Per-layer subpaths that compose `base.js` (and, where relevant,
  `no-upstream-imports.js`) with that layer's own constraints — `./config`,
  `./utils`, `./insight`, `./service`, `./db`, `./ui`, `./web`, `./studio`,
  `./auth`, `./platform` — each imported by that workspace's own
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
`apps/web`, `packages/studio`, `apps/platform`, `configs/tailwind`, `configs/vitest`.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
