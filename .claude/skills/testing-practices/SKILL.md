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
- **`web` and `ui` follow the same `src/testing/` pattern** for fixtures shared
  by more than one file (a component's `.test.tsx` **and** its `.stories.tsx`,
  or two unrelated test files that both need the same domain shape — e.g. an
  SEO object or a tag/author/post mock consumed by a page test and a metadata
  builder test). Mirror the component tree, keeping the `pages/`/`shared/`
  split (`src/components/pages/blog-post-page/` →
  `src/testing/pages/blog-post-page/fixtures.ts`); export small builder
  functions, import via the workspace alias (`@web/testing/…`), never a
  relative path once shared. A fixture used by exactly one test file stays
  inline; promote it the moment a second file needs the same shape — not
  necessarily the sibling story, any second consumer counts. Distinct from
  `src/storybook/fixtures/` (`web-storybook`) — Storybook-only view-model
  mocks (`TPostDetail`, …) never imported by a test.
- **Check `testing/` for an existing builder before writing a mock literal —
  REQUIRED, not a preference.** Before hand-rolling an object shaped like a
  known domain entity (SEO, tag, author, post/post-card, category, …) inside a
  `*.test.ts(x)` file, grep `packages/service/src/testing/` (service tests) or
  `apps/web/src/testing/`/`packages/ui/src/testing/` (web/ui tests) for a
  builder that already covers it (`makeRaw*` in service, `make*` in web/ui) —
  reuse it with `overrides` rather than duplicating the shape inline, even if
  the existing builder lives in a directory the new test wouldn't otherwise
  touch. If no builder exists yet and the shape is a generic domain entity
  (not something specific to the one component/route under test), **add the
  builder to `testing/` in the same PR** rather than inlining it "for now" —
  the promotion trigger above (second consumer) exists precisely so this
  doesn't need a separate follow-up PR once a second file predictably needs
  the same shape.
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
  text (`getByRole("button", { name: ... })`), assert rendered props and
  interactions via `@testing-library/user-event`. Never assert presentation
  CSS classes — not even ones that toggle with a prop/variant; a purely-visual
  variant is Storybook + `no-tests-needed`, not a class assertion (see "What
  not to test" for the full rule and the narrow data/state-driven exception).
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

- **Mock user/author names and emails are always fake — never a real person's
  name or email, including this repo's own maintainer.** Test fixtures for
  account/auth/identity/author data (`user.name`, `user.email`,
  `author.name`, avatar `alt`/`name` props, etc.) use a placeholder identity
  (`'Jane Doe'`, `'jane@example.com'`, or similar) instead of a real one that
  happened to be handy while writing the test. This applies to co-located
  `*.test.ts(x)` fixtures and `.stories.tsx` mock data alike — not to actual
  site content (blog posts, author bios) under `content/` or `docs/`, which
  legitimately name real people on purpose.
- Arrange–Act–Assert; one behaviour per `it`. Descriptive names:
  `it("renders the post title and author")`.
- **When a suite targets a single exported function, pass the symbol itself to
  `describe`, not a string.** Vitest derives the suite name from the
  reference's `.name`, so the label can never drift from the code: rename the
  symbol and the suite name follows, and deleting it is a compile error instead
  of a stale string. Use a string only when no single symbol names the suite.
  **Components are the exception** — they use the JSX-style template literal
  ``describe(`<${Component.name}/>`, …)``. Existing string titles migrate
  opportunistically when a test is touched; no mass rename.

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

  (This fixed `data-testid` differs from the consumer-supplied
  `IWithDataTestId`/`dataTestId` prop — that one is for the component's own
  root; this is a literal on a roleless internal element. Existing raw-DOM
  queries migrate opportunistically when a test is touched; no mass rewrite.)

- **`.toBeVisible()` for positive render assertions**, not
  `.toBeInTheDocument()` — the latter is valid only with `.not`, to assert
  absence.
- **No dedicated `dataTestId` test** — a test that queries by a missing test id
  already fails; an explicit assertion adds nothing.
- **Render component tests through the `customRender` factory from the package's
  `testing/custom-render` wrapper — never `render` from `@testing-library/react`
  directly.** `customRender(Component, defaultProps)` binds a component to its
  default props and returns a provider-wrapped `setup(overrides?)` renderer; the
  wrapper also re-exports the full RTL surface (`screen`/`fireEvent`/…) so a test
  imports everything from one module. Props are inferred from the component (via
  `NoInfer`) — no type argument at the call site.
  - `@blog/ui/testing/custom-render` — `customRender` + `renderElement`; the
    provider wrapper is a passthrough (`@blog/ui` is pure/prop-driven).
  - `@web/testing/custom-render` — `customRender`, `customRenderAsync`, and
    `renderElement`; mounts `NextIntlClientProvider` (matching `[locale]/layout.tsx`).

  Define `setup` once per file, then:
  - **Sync component + props** → `const setup = customRender(Component, {…});`
  - **Async server/page component** (called as `await Page({…})`) →
    `const setup = customRenderAsync(Page, {…});` and `await setup(…)` (also
    supports `await expect(setup({…})).rejects.toThrow(…)` for pages that throw).
  - **Ad-hoc JSX / not one component+props** (compound children, polymorphic `as`
    overrides, a pre-built element) → `renderElement(<…>)`.

  ```tsx
  import { customRender, screen } from '@blog/ui/testing/custom-render';

  const setup = customRender(PostMeta, { author, publishedAt, formattedDate });

  it('shows reading time when provided', () => {
    setup({ readingTimeMinutes: 5 }); // override one prop; defaults kept
    expect(screen.getByText('5 min read')).toBeVisible();
  });

  // ❌ never RTL's render directly: import { render } from '@testing-library/react';
  ```

- **`beforeEach(setup)` for uniform suites; inline `setup({…})` when props vary.**
  If every `it` in a suite renders the **same** props, call `setup()` in
  `beforeEach` and query `screen`. If tests need **different** props, call
  `setup({ overrides })` inline in each `it` — that is the factory's purpose, not
  the repeated-`renderComponent()` smell. Don't pair a `beforeEach(setup)` default
  with an inline override in the same `describe` (it double-renders); a genuinely
  different render goes in its own `describe`. (Testing Library auto-cleans
  between tests; drive small variations through the shared render where you can —
  e.g. an outside click via `fireEvent.mouseDown(document.body)`.)

  ```tsx
  // ✅ uniform props → beforeEach
  const setup = customRender(PostShare, defaultProps);
  describe(`<${PostShare.name}/>`, () => {
    beforeEach(() => {
      setup();
    });
    it('is closed by default', () => {
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });

  // ✅ varying props → inline setup({…}) per it (no beforeEach)
  const setup = customRender(Eyebrow, { children: 'Featured Post' });
  it('renders as a link when href is set', () => {
    setup({ href: '/category/x', children: 'X' });
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      '/category/x',
    );
  });
  ```

- Use `vi.fn()` / `vi.mock()` for boundaries (the Sanity client, `service`).
- Deterministic: no real dates/network/random. Inject or freeze.
- A bug fix gets a regression test that fails before the fix — **unless** it's
  a pure styling fix (borders/spacing/tokens) with no behavioural surface, which
  gets the `no-tests-needed` label instead of a class assertion.

## What not to test

- **Never assert Tailwind/CSS utility classes for presentation — REQUIRED, not a preference.**
  Do not use `toHaveClass` or match/contain on `className` for a class whose
  only job is **appearance**: layout (`w-full`, `max-w-page`, `grid`,
  `flex`, `hidden`, `sticky`), spacing (`mt-*`/`px-*`/`gap-*`/`pt-*`),
  colour/background/border (`text-accent`, `bg-bg`, `bg-bg-subtle`,
  `border-t`, `border-border-strong`), typography (`text-copy`, `text-lead`,
  `font-mono`), radius/shadow, or an icon's `size`. This holds **even when
  the class toggles with a prop/variant** — a _purely-visual_ variant
  (`tinted`, a `size`/`variant`/`intent` that only restyles, a
  `sm:`/`md:`/`lg:` responsive swap) is still not a class-assertion target:
  its effect is presentation, which belongs in a **Storybook story**, and the
  variant itself ships with **`no-tests-needed`**, not a `toContain('w-full')`.
  "This class used to be X, now it's Y" (a restyle, a bug fix, a token swap,
  an added/removed wrapper `<div>`) is likewise never a reason to assert it.
- **The only class assertion allowed** is when a class is the **sole
  observable of a genuine data- or state-driven behaviour** the test is
  exercising — e.g. a code block highlighting the specific lines its input
  data marks, an item reflecting active/current navigation state, a control
  reflecting disabled/error state. Even then: prefer a **semantic/ARIA or
  rendered-output** assertion if one exists (`aria-current`, `aria-disabled`,
  `role`, visible text, element presence) over the raw class, and if you must
  assert the class, add a one-line comment saying which behaviour makes it the
  sole observable. A bare "does this variant apply its classes" test is **not**
  this exception — that's presentation.
- Assert behaviour, semantics, and rendered output; never static styling. A
  purely-visual change has no unit-test surface — Storybook + `no-tests-needed`.
- **No snapshot tests** — they couple tests to markup and break on unrelated changes.
- **No implementation details** — test what a component does, not how it does it.
- **No network calls** — always mock the Sanity client and `service` functions.
- **Never mock a sibling `@blog/ui` component** to make a `web` test pass. If a
  test has to `vi.mock('@blog/ui')` and reimplement a fake `PostMeta`/panel,
  that's a composition smell — the web component is wrapping the pure one
  instead of being passed into its slot. Fix the structure
  (`web-component-practices`) and test the real composed tree.

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
