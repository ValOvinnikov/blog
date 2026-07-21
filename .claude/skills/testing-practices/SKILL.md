---
name: testing-practices
description: >-
  How to write and run tests in this monorepo with Vitest + Testing Library.
  Use when adding or updating unit tests for @blog/ui components, @blog/service
  query mappers, or web routes, configuring vitest, or deciding what to test.
  Apply whenever adding a *.test.ts(x) file or wiring test config.
---

# Testing practices (Vitest + Testing Library)

Stack: **Vitest** as the runner, **@testing-library/react** + **jest-dom** for
components, **jsdom** for the DOM environment. Shared config lives in
`@blog/config/vitest/preset`.

**Two-tier, by design.** Each layer agent (`cms`/`service`/`ui`/`web`) still
writes tests for what it implements — that responsibility isn't removed. The
`test-writer` subagent (`.claude/agents/test-writer.md`) runs afterward as a
dedicated, fresh-context pass over the same diff, per `develop-feature` step
4: it catches gaps a layer agent's attention thins out on by the end of its
own run, and is the one that owns raising coverage if thresholds land later
(#396). Overlap where a layer agent already wrote thorough coverage is
expected and fine — `test-writer` adds only what's missing, it doesn't
duplicate or rewrite adequate existing tests.

## Where tests live

- **Co-located** next to the source file, named `{filename}.test.ts(x)`:
  `Button.tsx` → `Button.test.tsx`, `transformer.ts` → `transformer.test.ts`.
- Service fixtures live in `packages/service/src/testing/`, mirroring the
  domain tree. Each exports a `make*` factory returning a raw (`TRaw*`) shape
  with a `Partial<…>` overrides param. Import via the workspace alias:
  `import { makeRawPostCard } from '@blog/service/testing/pages/fixtures'`.
- **`web` (and `ui`) follow the same `testing/` pattern** for fixtures shared
  by more than one file — typically a component's `.test.tsx` **and** its
  `.stories.tsx`. Mirror the component tree under `src/testing/`, including
  the `pages/`/`shared/` split (see the `web` agent's "File organisation"):
  `src/components/shared/portable-text-renderer/` →
  `src/testing/shared/portable-text-renderer/fixtures.ts`;
  `src/components/pages/blog-post-page/` →
  `src/testing/pages/blog-post-page/fixtures.ts`. Export small builder
  functions (not one giant literal) plus any ready-made sample data the
  stories need, and import via the workspace alias —
  `import { richTextBlock } from '@web/testing/shared/portable-text-renderer/fixtures'`
  — never a relative `./` path once the fixture is shared. A fixture used by
  only one test file with no story to share it stays inline in that test file;
  promote it to `src/testing/` the moment a second file (usually the sibling
  story) needs the same data. This is distinct from `src/storybook/fixtures/`
  (`web-storybook`) — that directory is Storybook-only view-model mocks
  (`TPostDetail`, `THomePage`, …) never imported from a test; `src/testing/`
  fixtures are shared by both.
- Run from root: `pnpm test` (all), or `pnpm --filter @blog/ui test`.
  Watch mode: `pnpm test:watch`.

## When to run tests

- Run `pnpm --filter <pkg> type-check` after each major group of files — fast,
  catches structural errors early without verbose test output.
- Run the full test suite **once, after all implementation is complete**:
  `pnpm --filter <pkg> test`.

## Per-package setup

- **ui / web** (`jsdom`): a `vitest.config.ts` merges the preset and sets
  `environment: "jsdom"` + `setupFiles: ["./vitest.setup.ts"]`, where the setup
  file does `import "@testing-library/jest-dom/vitest";`.
- **service** (`node`): merge the preset with `environment: "node"`. No DOM.
- **Import aliases in tests.** Each `vitest.config.ts` `resolve.alias` must map
  the workspace's own alias **and every dependency's** alias (e.g. service's
  vitest maps `@blog/service/*` → its `src` and `@blog/config/*` → config's
  `src`). Vitest doesn't read `tsconfig` `paths`, so a missing dependency alias
  makes cross-package imports — and `vi.mock` of an aliased module — fail. Add a
  new dependency's alias here whenever a package starts importing it in tests.
  See CLAUDE.md → Conventions (per-workspace aliases).

```ts
// vitest.config.ts (ui / web)
import preset from '@blog/config/vitest/preset';
import { defineConfig, mergeConfig } from 'vitest/config';
export default mergeConfig(
  preset,
  defineConfig({
    test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
  }),
);
```

## What to test (and what not to)

- **`@blog/ui`** — behaviour and contract, not markup snapshots. Query by role/
  text (`getByRole("button", { name: ... })`), assert rendered props, variants,
  and interactions via `@testing-library/user-event`. Avoid testing class names.
- **`@blog/service`** — pure logic: GROQ result → domain mapping, `urlForImage`
  output, error/empty handling. **Mock the Sanity client** (`vi.mock`); never
  hit the network. No `revalidate` timing tests.
- **`web`** — route/page components with `service` functions mocked; assert that
  the data renders and metadata is produced. Keep these light; prefer pushing
  logic down into `ui`/`service` where it's cheaper to test.
- **`apps/cms/migrations/*`** (when one is authored — the directory currently
  holds only the tooling) — a migration's `document()` handler is a pure
  function (doc → mutations), so test it directly. Cover **transform correctness**
  (a legacy doc maps to the expected module/field shape) and **idempotency**
  (running it against an already-migrated doc returns `undefined`/no-op — never
  re-transforms or overwrites data). Extract the transform into a small helper if
  that makes it easier to assert.

## Conventions

- Arrange–Act–Assert; one behaviour per `it`. Descriptive names:
  `it("renders the post title and author")`.
- **When a suite targets a single exported function, pass the symbol itself to
  `describe`, not a string.** Vitest derives the suite name from the
  reference's `.name`, so the label can never drift from the code: rename the
  symbol and the suite name follows, and deleting it is a compile error instead
  of a stale string. Use a string only when no single symbol names the suite.
  **Components are the exception** — they use the JSX-style template literal
  ``describe(`<${Component.name}/>`, …)`` (see `ui-library-practices`).
  Existing string titles migrate opportunistically when a test is touched; no
  mass rename.

  ```ts
  import { objectKeys } from './objects';

  describe(objectKeys, () => {
    // ✅ suite name tracks the symbol
    it("returns the object's keys", () => {
      /* … */
    });
  });

  // ❌ describe('objectKeys', () => { … })  — string drifts on rename
  ```

- Prefer semantic queries (`getByRole`, `getByText`, `getByLabelText`) over
  `getByTestId`. Use `getByTestId` when a semantic query would be ambiguous —
  this is common in molecule and organism integration tests where the same role
  appears multiple times (e.g. multiple `<img>` or `<button>` elements).
  `IWithDataTestId` is on every `@blog/ui` component for exactly this purpose.
- **Never drop to a raw DOM query** (`container.querySelector`/`querySelectorAll`,
  `document.querySelector`, or any other direct DOM API) in place of a
  Testing Library query. If no semantic query reaches an element — typically a
  purely decorative, empty, roleless element like a blinking-cursor span —
  add a **fixed, hardcoded `data-testid`** directly on that element in the
  component and query it with `getByTestId`/`queryByTestId`:

  ```tsx
  // ✅ correct — element has no role/text, so it gets its own fixed test id
  <span className={cursor()} aria-hidden="true" data-testid="cursor" />;

  // test:
  expect(screen.getByTestId('cursor')).toHaveAttribute('aria-hidden', 'true');

  // ❌ wrong — raw DOM query as an escape hatch
  expect(container.querySelector('[aria-hidden="true"]:empty')).toBeTruthy();
  ```

  This hardcoded `data-testid` is a **different concept** from the
  `IWithDataTestId`/`dataTestId` prop above — that one is consumer-supplied,
  for the component's own root element; this one is a fixed literal on an
  internal sub-element with no other query path. Both are legitimate; don't
  conflate them. Existing raw-DOM-query usage migrates opportunistically when
  a test is touched; no mass rewrite.

- Use `vi.fn()` / `vi.mock()` for boundaries (the Sanity client, `service`).
- Deterministic: no real dates/network/random. Inject or freeze.
- A bug fix gets a regression test that fails before the fix.

## What not to test

- **Never test CSS class names** — assert behaviour and output, not styling.
- **No snapshot tests** — they couple tests to markup and break on unrelated changes.
- **No implementation details** — test what a component does, not how it does it.
- **No network calls** — always mock the Sanity client and `service` functions.

## Coverage strategy

Think pyramid: **many** fast, focused unit tests (`ui`/`service`/migrations),
**few** heavier route/integration tests. Spend coverage on what matters —
**business-critical paths, edge cases (empty/null/limits), error & empty
handling, and data integrity/idempotency**. **Skip** trivial getters, framework
code, and one-off scripts. When adding a feature, do a quick **gap scan**: does
each new critical path _and_ each error/empty branch have a test? Note gaps
rather than leaving them silent.

## Checklist

- [ ] Test co-located and named `*.test.ts(x)`.
- [ ] Migrations: transform-correctness + idempotency tested.
- [ ] Right environment (jsdom for components, node for service).
- [ ] Boundaries mocked; no network, no real time.
- [ ] Queried by role/text; asserts behaviour, not implementation detail.
- [ ] `pnpm --filter <pkg> test` passes.
