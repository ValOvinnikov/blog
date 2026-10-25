# Test suite performance findings

What makes `pnpm test` slow, what was measured, and what was rejected. Latest
investigation: 2026-10-25, Vitest 5.0.5, 8-core / 16 GB Mac. Timings below
were taken one suite at a time unless a row says otherwise. The same command
varied by up to ±30% between rounds on this machine, so compare variants only
within one round. A variant counts as adopted only if every test still passes.
The adopted changes are tracked in epic #5892; "Follow-ups not filed" at the
end lists what has no ticket.

## Per-suite picture

| suite           | files | local `pnpm test` (turbo, concurrent) | alone, default | dominant phases                   |
| --------------- | ----- | ------------------------------------- | -------------- | --------------------------------- |
| `apps/platform` | 352   | 472s                                  | 243–359s       | environment, tests, import, setup |
| `apps/web`      | 330   | 262s                                  | 224–313s       | environment, import, setup        |
| `packages/db`   | 207   | 366s                                  | 350s           | tests (PGlite), import            |
| `apps/worker`   | 37    | 36s                                   | —              | import (88%)                      |
| `packages/auth` | 17    | 12s                                   | —              | import, transform                 |

`packages/db` is as slow alone as under turbo, so it is not slowed by
contention. It used only ~2.85 of 8 cores (`823s user / 351s wall`).

## `packages/db`

### No test touches Neon

Every db test runs against **PGlite**, Postgres compiled to WASM and running
in-process. `src/testing/global-setup.ts` builds one migrated instance per
vitest run and snapshots it. `createTestDb()` restores a private copy per test
file. No test file in any workspace calls `neon(` or imports
`@neondatabase/serverless` against a real database. The `DATABASE_URL` values
in `packages/auth/vitest.config.ts` and `db/src/client.test.ts` are syntactic
placeholders. So the usual advice — local Postgres instead of remote Neon,
Neon branches in CI, the Neon pooler for parallel tests — is either already
true or does not apply.

PGlite is the right engine here:

- **pg-mem** cannot run the real migration SQL: `DO $$` blocks, a plpgsql
  function, 10 `CREATE TYPE` enums, and the partial unique index in
  `0058_add_self_serve_free_tenant_guard.sql` that `is-free-owner-violation.ts`
  relies on.
- **Docker Postgres** would be closer to Neon and could run the pgvector
  migration that PGlite skips. It would also add a service on every dev
  machine and CI runner, a network driver in tests, and coordination across
  parallel worktrees. The PGlite costs below can be amortised without it.

### Where the time goes

Measured from Vitest's per-file results (durations include hooks):

| test files                                          | files | share of file time |
| --------------------------------------------------- | ----- | ------------------ |
| migration replay (`src/schema/*-migration.test.ts`) | 14    | **47%** (626s)     |
| query tests (`useQueryTestDb`, one PGlite per file) | 140   | 51% (681s)         |
| `createTestDb()` direct, client test, pure units    | 53    | 2%                 |

- **Migration-replay tests** call `new PGlite()` for every `it()`. That runs a
  full `initdb` (2.5s alone, ~7–8s under parallel load) and then replays every
  migration (0.23s for all 58). There were 3 such files and 16 migrations in
  August; there are now 14 files and 58 migrations.
- **Query test files** pay a fixed ~4.5s each under load (fitted over 114
  files: 4.49s per file + 0.078s per test). That is the PGlite boot plus the
  snapshot restore. The test bodies and their `afterEach` DELETEs total about
  51s.
- **Import** is 38–46% of the Duration line. With the default `forks` pool and
  `isolate: true`, every file gets a fresh process that re-imports drizzle,
  PGlite (2.1 MB JS + 10.5 MB WASM), the schema barrel and faker.

PGlite micro-benchmark (one process, quiet machine):

| operation                                       | time          |
| ----------------------------------------------- | ------------- |
| `new PGlite()` + `waitReady` (initdb)           | 2,454–2,659ms |
| replay 58 migrations                            | 231ms         |
| `PGlite.create({ loadDataDir })`, gzip snapshot | 648–869ms     |
| same, uncompressed snapshot (41 MB vs 4.7 MB)   | 501ms         |
| `clone()` of a migrated instance                | 630–717ms     |
| `TRUNCATE` every public table `CASCADE`         | 36ms          |
| `BEGIN` / `ROLLBACK`                            | 1ms           |

### Measured variants

| variant                                   | wall            | result                       |
| ----------------------------------------- | --------------- | ---------------------------- |
| default (`forks`, isolated)               | 350s            | 207 / 1098 pass              |
| `--pool=threads`                          | 231–288s        | all pass                     |
| `--no-isolate`                            | 186s            | **24 files / 81 tests fail** |
| replay fix, `src/schema` only, forks      | 98s → 57s       | all pass                     |
| replay fix, `src/schema` only, threads    | 78–84s → 40–41s | all pass                     |
| replay fix + `--pool=threads`, full suite | 214–238s        | all pass                     |

The **replay fix** prototype: global setup also snapshots an empty
post-`initdb` PGlite, and the replay tests restore that instead of calling
`new PGlite()`. No assertion changes. It halves the migration files, but the
whole suite gains only 10–17%: those files finish within the first ~95s, and
the rest of the run is import and collection of the other 193 files.

**`--no-isolate` failed** with `getDb()` returning `undefined`. Each query
test mocked `@blog/db/client` with its own `vi.hoisted` `getDbMock`, so with
isolation off a query module imported by an earlier file in the same worker
kept that file's (now reset) mock.

**Adopted:** every db test now takes the shared `src/__mocks__/client.ts`
through a bare `vi.mock('@blog/db/client')`, and `useQueryTestDb()` points its
`getDb` at the file's PGlite instance and closes that instance after the file.
`vitest.config.ts` sets `unstubEnvs: true`.

**`isolate: false` stays rejected.** Measured back to back on one 4-core
machine, both on `pool: 'threads'`:

| run                    | default isolation | `--no-isolate`                       |
| ---------------------- | ----------------- | ------------------------------------ |
| full suite (214 files) | 136s, all pass    | 109–119s, **1–3 files fail per run** |
| `src` only (179 files) | 119s, all pass    | 108s, all pass                       |

The remaining failures are all in `scripts/deprovision-tenant` and
`scripts/invalidate-tenant-cache`, and change with file order. Those tests
mock shared modules (`@blog/db/queries/audit-events`, the `steps/*` modules,
`request-tenant-cache-invalidation`) with per-file factories, or mock a module
that a sibling file uses for real, so whichever file loads the module first
wins. Fixing them means restructuring those mocks, for a 10–20% gain.

### Rejected

- **`clone()` per file** — in PGlite 0.5.10 `clone()` is `dumpDataDir('none')`
  plus `PGlite.create({ loadDataDir })`, the same restore path.
- **Transaction-per-test rollback** — at most ~4% (all per-test time is ~51s),
  25 files expect database errors that would abort the outer transaction, and
  `now()` would freeze for ordering tests. Code under test never calls
  `.transaction()`.
- **Uncompressed snapshot** — about 1–3%.

### Open policy question

The backfill tests for migrations already applied in production could be
retired. No rule requires keeping them, and global setup replays every
migration on every run. Retiring them would also touch
`docs/features/bookmarks.md` and `docs/features/tenant-access.md`.

## `apps/web` and `apps/platform`

### Measured variants

| variant                                                                | platform                        | web                              |
| ---------------------------------------------------------------------- | ------------------------------- | -------------------------------- |
| default                                                                | 243–358s                        | 224–231s                         |
| `--pool=threads`                                                       | 225–321s, all pass (−7 to −10%) | 169–200s, all pass (−11 to −27%) |
| jsdom project only, default                                            | 257s                            | 196s                             |
| jsdom project, `vmThreads`, `vmMemoryLimit=1024MB`                     | 97s, **3 files fail**           | 50s, **6 files fail**            |
| same + web-streams polyfill setup file                                 | **198s → 70s**, all pass        | **185s → 51s**, all pass         |
| full run: node project `threads`, jsdom project `vmThreads` + polyfill | **240s → 102s**, all pass       | **208s → 84s**, all pass         |
| `NODE_COMPILE_CACHE` warm                                              | —                               | no measurable change             |

**`vmThreads`** imports jsdom once per worker and builds a fresh `window` per
file, so `vi.mock` stays per file. Without help, 9 files fail at collection
with `ReferenceError: ReadableStream is not defined` from undici's webidl
module, because the vm context exposes no web-streams globals. A setup file
that assigns `ReadableStream`, `WritableStream` and `TransformStream` from
`node:stream/web` when they are missing fixes all 9. Watch memory: the
default `vmMemoryLimit` is `1/maxWorkers` of RAM, so set it explicitly.

**Adopted** in `createVitestConfig()` (`configs/vitest/preset.ts`): the `node`
project on `threads`, the `jsdom` project on `vmThreads` with
`vmMemoryLimit: '1024MB'` and the `vm-web-streams.ts` setup file. It also
aliases bare `react-syntax-highlighter` to its ESM entry, because the vm
CommonJS loader cannot `require()` the ESM-only `refractor` its CJS build
loads. Re-measured on a 4-core machine: web 181s → 81s, platform 221s → 98s,
every test passing.

### Not measured, with evidence

- **Setup files load more than node tests need.** Each app's
  `src/vitest-setup.ts` runs for both projects and eagerly loads jest-dom
  (~204 modules), next-intl's client build and the `@blog/config` barrel.
  None of the 298 node-project files uses a jest-dom matcher.
- **faker's root entry** loads every locale: 86 files / 2.39 MB, against 3
  files / 0.42 MB for `@faker-js/faker/locale/en`. The root `faker` export is
  the `en` instance, and all 184 imports in the repo use the root entry.
  **Adopted:** the shared preset aliases exactly `@faker-js/faker` to the
  English build, so no import changed (Storybook keeps the root entry).
  Measured with `--experimental.importDurations.print`: faker's import fell
  from 167–179ms to 24–35ms per test process.
- **`react-syntax-highlighter`** is imported from its package index in
  `code-block.tsx`, which loads highlight.js and refractor in full (587
  modules) for 49 web jsdom test files and the production server.
- **`isolate: false` stays rejected for both apps.** 54–63% of their files use
  `vi.mock`, which shares the db problem above and has no setup-level fix.
  Separately, `@testing-library/react` registers `afterEach(cleanup)` and
  sets `IS_REACT_ACT_ENVIRONMENT` only when first imported, so with isolation
  off later files in a worker get no cleanup and no act warnings.
  `packages/ui` works with `isolate: false` because its setup calls `cleanup()`
  itself and only 2 of its 72 files mock.
- **happy-dom**: medium risk (DOMParser for RSS, custom-property
  `getComputedStyle`, Base UI), and mostly superseded by `vmThreads`.

## `act()` warnings

Whole-suite runs print **206** act warnings in 12 platform files and 5 in 3
web files, plus 13 Suspense-related lines. A single-file `vitest run` hides
console output from passing tests, so count with `--silent=false`.

**`apps/platform` is fixed**: a whole-suite run with `--silent=false` used to
print 219 "not wrapped in act" warnings and 16 Suspense act messages, and now
prints none. The rules that keep them out: select the primitive a component
shows, never a fresh object (`useEditorSelector` compares with `Object.is`);
a page that suspends on `use()` renders inside an awaited `act`, which
`customRenderAsync` does; focus moves through user-event, never
`element.focus()`/`.blur()`; a test that leaves a promise pending waits for it
to settle. `apps/platform/src/vitest-setup.ts` fails any test during which
React reports an act() warning, naming the message.

**`apps/web` is fixed**: the async render helpers, the server-tree walk, the
fake IntersectionObserver and `env.test.ts` changed as the table describes. `apps/web/src/vitest-setup.ts` now fails any test during which React
reports an act() warning, naming the message, so new ones cannot return
unnoticed.

| source                                                                                | count | cause                                                                                                                                                                       | fix                                                                                                                |
| ------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `PortableTextEditorToolbar` (8 platform files)                                        | 135   | `useEditorSelector(editor, selectors.getActiveAnnotations)` gets a new `[]` per snapshot, so every coalesced editor update (a microtask after mount) re-renders the toolbar | component: select the derived href string instead of the array — also stops a toolbar re-render on every keystroke |
| Base UI `SliderRoot` / `FieldRootInner` (look-form, hue-slider, tenant-details-panel) | 49    | tests call `element.focus()` / `.blur()` directly; user-event wraps its own focus in act                                                                                    | tests: focus via `user.click` on the label or `user.tab()`                                                         |
| `LookForm`, `SettingsFormShell`, `FeaturesSettings`, `ToastProvider`                  | 14    | "busy while saving" tests resolve the save promise as their last line; the save finishes as an async transition afterwards                                                  | tests: `await waitFor` until the busy button is gone                                                               |
| platform async page tests (tenant detail, owner dashboard)                            | 13    | `customRenderAsync` renders synchronously; `LiveDomainCard` suspends on `use()` inside that act                                                                             | shared helper: `return act(async () => render(ui))`                                                                |
| web `BookmarkButton` (post-article, bookmark-button-gate)                             | 3     | an effect's `.then(setState)` resolves before the async helper returns                                                                                                      | shared helpers: the same awaited act in `customRenderAsync` / `customRenderServerAsync`                            |
| `LeadPageSource`, web `Harness`, tooltip, `VoiceSurfaceCard`                          | 8     | sync render in an async `beforeEach`; a fake IntersectionObserver calling its callback outside act; raw `.focus()`                                                          | tests and the fake                                                                                                 |

Every source above was fixed in an experiment, re-run to 0 warnings, and
reverted. All tests in the affected files kept passing. Only the toolbar
needed a product change. Also found:

- **13 web "unique key" warnings** come from `customRenderServerAsync`'s tree
  walk (`cloneElement` drops React's static-children mark, and a keyed async
  element loses its key), not from components.
- **`prefetch={false}`** reaches a plain `<a>` through
  `apps/platform/src/i18n/__mocks__/navigation.ts`.
- **"Invalid environment variables"** lines are expected output of negative env
  tests.
- **`FakeIntersectionObserver` is declared twice** in `apps/web`:
  `back-to-top-button.test.tsx` and `use-active-heading-id.test.tsx`, and the
  first wraps each trigger in its own `act()`.

## Orchestration

- **Turbo concurrency is capped (adopted).** Every vitest instance defaults
  to `availableParallelism() - 1` = 7 workers, so turbo's default of 10
  instances put up to 70 workers on 8 cores. CI's Test job runs
  `--concurrency=2`; the root `pnpm test` script runs `--concurrency=50%`,
  which also covers `deploy-development.yml`. Measured with `--force` on 8
  cores: default 8m55s, `50%` 7m07s, and the contention timeouts stopped
  (`ci-automation.md`).
- **Keep `test`'s `dependsOn: ["^build"]`.** No package has a `build` script,
  but the dependency is likely what invalidates a suite's cache when a package
  it reads through an alias changes.
- **`apps/worker` and `packages/auth`**: `isolate: false` is unsafe for the
  same `vi.mock` reason. Their import time comes from the tests themselves:
  `importOriginal` spreads of the db tenants barrel in
  `fake-tenants-queries.ts` (18 files), the real `workflow` package loaded
  through `importOriginal` (10 files), and `config.test.ts` importing the whole
  `@blog/db` barrel up to 4 times.
- **`isolate: false` candidates** (no or few module mocks, unmeasured):
  `packages/utils`, `packages/email`, and `packages/studio`'s `migrations`
  project.

## Follow-ups not filed

Kept here rather than ticketed, because the gain is unmeasured and small, or a
decision comes first:

- **Trim `apps/worker` and `packages/auth` test imports** — about 48s of suite
  time between them. Stop spreading `importOriginal()` in
  `fake-tenants-queries.ts`, replace the real `workflow` package in tests with
  a light shim that re-exports its error classes, turn db automocks into
  factories, and mock `@blog/db` in auth's `config.test.ts`. Measure with
  `--experimental.importDurations.print` first.
- **`isolate: false` for `packages/utils`, `packages/email` and
  `packages/studio`'s `migrations` project** — none or almost none of their
  files mock modules. Validate each with a normal run and a
  `--sequence.shuffle` run before adopting it.
- **Import `react-syntax-highlighter`'s Prism build directly** in
  `code-block.tsx` instead of the package index, which loads highlight.js and
  refractor in full for 49 web test files and the production server. The
  light build only highlights registered languages, so this changes what
  readers see for an unregistered language; it needs a measured reason and a
  manual test.
- **Retire the backfill tests of migrations already applied in production**
  — a policy decision; see "Open policy question" under `packages/db`.

## Earlier findings that still hold

- `apps/web` and `apps/platform` run `*.test.ts` in a `node` project and
  `*.test.tsx` in a `jsdom` project (`configs/vitest/preset.ts`), because jsdom
  construction dominated the original reference run.
- **`include` merges, `exclude` replaces.** A project's `include` is merged with
  the inherited root `include`, so an `include`-based split widens each project
  to the whole suite. Split via `exclude`, and check the partition with
  `vitest list --project <name> --filesOnly`.
- A `.ts` test that needs a DOM opts back in with a `@vitest-environment jsdom`
  docblock.
