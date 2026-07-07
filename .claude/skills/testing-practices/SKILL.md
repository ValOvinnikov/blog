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

## Where tests live

- **Co-located** next to the source file, named `{filename}.test.ts(x)`:
  `Button.tsx` → `Button.test.tsx`, `transformer.ts` → `transformer.test.ts`.
- Service fixtures live in `packages/service/src/testing/`, mirroring the
  domain tree. Each exports a `make*` factory returning a raw (`TRaw*`) shape
  with a `Partial<…>` overrides param. Import via the `#/` alias:
  `import { makeRawPostCard } from '#/testing/pages/fixtures'`.
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

## Conventions

- Arrange–Act–Assert; one behaviour per `it`. Descriptive names:
  `it("renders the post title and author")`.
- Prefer real user-facing queries (`getByRole`, `getByText`) over `data-testid`.
- Use `vi.fn()` / `vi.mock()` for boundaries (the Sanity client, `service`).
- Deterministic: no real dates/network/random. Inject or freeze.
- A bug fix gets a regression test that fails before the fix.

## What not to test

- **Never test CSS class names** — assert behaviour and output, not styling.
- **No snapshot tests** — they couple tests to markup and break on unrelated changes.
- **No implementation details** — test what a component does, not how it does it.
- **No network calls** — always mock the Sanity client and `service` functions.

## Checklist

- [ ] Test co-located and named `*.test.ts(x)`.
- [ ] Right environment (jsdom for components, node for service).
- [ ] Boundaries mocked; no network, no real time.
- [ ] Queried by role/text; asserts behaviour, not implementation detail.
- [ ] `pnpm --filter <pkg> test` passes.
