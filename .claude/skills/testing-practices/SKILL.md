---
name: testing-practices
description: >-
  How to write and run tests in this monorepo with Vitest + Testing Library.
  Use when adding or updating unit tests for @blog/ui components, @blog/service
  query mappers, or web routes, configuring vitest, or deciding what to test.
  Apply whenever adding a *.test.ts(x) file or wiring test config.
---

# Testing practices (Vitest + Testing Library)

Vitest runs everything; components use `@testing-library/react`, `jest-dom`
and `@testing-library/user-event` on jsdom.

**Who writes tests.** A bugfix's regression test is written first by the
owning layer agent (`superpowers:test-driven-development`). New-feature
coverage comes from `test-writer`'s fresh-context pass (`develop-feature` §4),
which adds only what protects behaviour, deletes a new test that fails "What
not to test", and treats "nothing to add" as a complete outcome.

## Where tests live

- **Co-located**, named `{filename}.test.ts(x)`: `button.tsx` →
  `button.test.tsx`.
- **A fixture two or more files need lives in that workspace's
  `src/testing/`**, mirroring the source tree
  (`apps/web/src/components/pages/blog-post-page/` →
  `apps/web/src/testing/pages/blog-post-page/fixtures.tsx`). Export small
  builders taking a `Partial<…>` overrides param, named per "Fixture
  naming", and import them through the workspace alias (`@web/testing/…`),
  never a relative path. Service builders return the raw `TRaw*` shape. A
  fixture one test file uses stays inline; it moves to `testing/` in the change that
  adds a second consumer — a story or any other test file counts. A fixture
  literal repeated across files is the same case: it becomes a builder.
  Story-only view-model data follows `web-storybook`.
- **Fixture naming — required.** A function exported from `testing/`, a
  `fixtures` file or `__mocks__/` that returns fake data is named
  `mock<Thing>`; a fixed fake value exported from one is `MOCK_<THING>`. The
  prefix keeps a fixture from reading as, or colliding with, product code
  (`makeAsideTypeComponent` is a product factory).

  ```ts
  export const mockContactFormModule = (overrides = {}) => ({ … }); // ✅
  export const MOCK_TENANT_ID = faker.string.uuid(); // ✅
  export const makeContactFormModule = (overrides = {}) => ({ … }); // ❌
  export const TEST_TENANT_ID = faker.string.uuid(); // ❌
  ```

  Render and setup helpers (`customRender`, `renderElement`,
  `renderWithIntl`) are not fixtures and keep their names. Existing `make…`,
  `get…` and `test…` fixtures are renamed when their workspace's rename
  lands, never in a file the diff merely touches; a new fixture is named by
  the rule from the start.

- **Check `testing/` for a builder before writing a mock literal — required.**
  Before hand-rolling an object shaped like a domain entity (SEO, tag,
  author, post, category, tenant, membership, …), grep the workspace's
  `src/testing/` — and `packages/service/src/testing/` for raw Sanity shapes —
  and reuse the builder with overrides, even from a directory the test would
  not otherwise touch. A generic entity with no builder yet gets one in
  `testing/` in the same PR, not inline "for now".
- **Test inputs and expectations use existing consts — required.** Check
  `packages/config/CONSTANTS.md` before typing a value into a test, and
  write `expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)`, never `404`.
  A value a test file writes a second time becomes a const — or a `testing/`
  builder when it is entity-shaped (CLAUDE.md → "Reuse a const; never retype
  its value"). `prefer-shared-constant`, `no-duplicate-string` and
  `pnpm check:duplicate-literals` enforce this on touched test files too.
  Using a const is not asserting it: `expect(HTTP_STATUS.NOT_FOUND).toBe(404)`
  still falls under "What not to test".
- **Run:** `pnpm test`, `pnpm --filter <pkg> test`, `pnpm test:watch`. Run
  `pnpm --filter <pkg> type-check` after each group of files and the full
  suite once, when implementation is complete.

## Per-package setup

The shared preset is `@blog/vitest-config/preset` (`configs/vitest/preset.ts`):
globals, `src/**/*.{test,spec}.{ts,tsx}`, `clearMocks`.

- **`apps/web`, `apps/platform`** — `createVitestConfig({ resolve: { alias } })`
  from the preset: jsdom, `src/vitest-setup.ts`, `server-only` stubbed. It
  runs `*.test.ts` in a `node` project and `*.test.tsx` in `jsdom`, so a test
  that renders JSX is `.tsx`. When the extension picks the wrong environment
  — a `.ts` test that needs `DOMParser`, `window` or `renderHook`, a `.tsx`
  that must run in `node` — its first line is a
  `@vitest-environment <env>` docblock: the one per-file override, and the
  only comment a test file may carry.
- **`packages/ui`** — merges the preset with jsdom and `src/test-setup.ts`.
- **Every other package** runs in `node`; `service`, `db`, `auth` and `email`
  also set `mockReset: true`.
- **Aliases.** Vitest does not read `tsconfig` `paths`. `resolve.alias` maps
  the workspace's own alias and every dependency's
  (`blogPackageAlias('<pkg>', import.meta.url)` in the apps), or cross-package
  imports — and `vi.mock` of an aliased module — fail.

## What to test

- **`@blog/ui`** — behaviour and contract through roles, text and
  `userEvent` ("Writing a component test"); never markup, never a class.
- **`@blog/service`** — pure logic: GROQ result → domain mapping,
  `urlForImage` output, error/empty handling, with the query runner faked.
  No `revalidate` timing tests.
- **`apps/web`, `apps/platform`** — pages and components with only the edges
  faked ("What to fake"); assert what renders and the metadata produced. Keep
  route tests light — push logic down to where it is cheaper to test.
- **`packages/studio`** — never a schema definition ("What not to test").
  Test the code outside
  `schema-types/{documents,objects,modules,fields}/` — pure helpers and
  wiring such as the cross-document validators in `schema-types/validation/`,
  the `schema-types/{inputs,preview,queries,portable-text}/` helpers,
  `structure/`, `document-actions/`, `testing/`, `studio-config` and
  `studio-mount`.
- **`packages/studio/migrations/*`** — test the `document()` handler directly,
  a pure doc → mutations function. Cover **transform correctness** (a legacy
  doc maps to the expected shape) and **idempotency** (an already-migrated doc
  returns `undefined`, never re-transformed). Extract the transform into a
  helper when that makes it easier to assert.

## Conventions

- **Identities in fixtures are fake** — never a real person's name or email,
  the maintainer's included. `user.name`, `user.email`, `author.name`, avatar
  `alt` and the like use placeholders (`'Jane Doe'`, `'jane@example.com'`) in
  tests and stories alike.
- **One behaviour per `it`, Arrange–Act–Assert, and the title states that
  behaviour in 80 characters or fewer.** It never names a prop, a mock, a
  helper or how the code gets there: "labels the region with the carousel
  title", not "composes the region label from the carousel.regionLabel Voice
  key rather than passing the title straight through". A title that needs
  "rather than" or "instead of" is arguing with an implementation nobody
  wrote. Shorten long existing titles when the file is touched, never in a
  sweep.
- **Suite naming — never a hand-written string when a symbol names the
  suite.** Vitest takes the label from the reference's `.name`, so a rename
  follows and a deletion is a compile error.

  | the suite targets                            | form                                    |
  | -------------------------------------------- | --------------------------------------- |
  | a **component**                              | ``describe(`<${Component.name}/>`, …)`` |
  | anything else (function, hook, class, const) | `describe(theSymbol, …)`                |

  ```tsx
  // ✅ a component: JSX-style, no space before the slash
  describe(`<${PostShare.name}/>`, () => {});
  // ✅ anything else: the symbol itself
  describe(objectKeys, () => {});
  // ❌ describe(PostShare, …)   — a bare symbol on a component is a defect
  // ❌ describe('PostShare', …) — a string drifts on rename
  ```

  A string is right only when no single symbol names the suite — a registry,
  a route module, a group of behaviours. Existing string titles migrate when
  the file is touched, never in a mass rename; a bare symbol on a component
  is fixed whenever the file is touched and never written new.

- **Deterministic:** no real dates, network or randomness — inject or freeze.
- **No nested `expect` — assert exact values.** Never an asymmetric matcher
  inside an assertion: `expect.objectContaining`, `expect.any`,
  `expect.anything`, `expect.stringContaining`, `expect.arrayContaining` or
  `expect.not.*`. Pass the whole expected value, built from the same
  consts and `testing/` builders the arrangement used; freeze the clock
  instead of `expect.any(Date)`. When only part of a call matters, destructure
  it into named consts first and assert each one exactly.

  ```ts
  expect(updateProvisioningStep).toHaveBeenCalledWith({
    tenantId: MOCK_TENANT_ID,
    step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
  }); // ✅
  const [email] = vi.mocked(sendEmail).mock.calls.map(([input]) => input);
  expect(email?.to).toBe(OWNER_EMAIL); // ✅

  expect(updateProvisioningStep).toHaveBeenCalledWith(
    expect.objectContaining({ detail: ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED }),
  ); // ❌
  ```

  A test file you create or touch is converted whole; files the change does
  not touch stay as they are.

- **A bugfix gets a regression test that fails before the fix**, unless it is
  a pure styling fix with no behavioural surface, which gets
  `no-tests-needed` instead of a class assertion.

## Rendering and arrangement

- **Render through the workspace's `testing/custom-render` — never RTL's own
  `render`.** The wrapper mounts the app's providers and re-exports the RTL
  surface (`screen`, `within`, `fireEvent`, …), so a test imports everything
  from it; its re-exported `render` still skips the providers.
  `customRender(Component, defaultProps)` returns `setup(overrides?)`, with
  props inferred (`NoInfer`) — no type argument.

  | wrapper                           | exports                                                                         | providers                                                           |
  | --------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
  | `@blog/ui/testing/custom-render`  | `customRender`, `renderElement`                                                 | passthrough — `@blog/ui` is prop-driven                             |
  | `@web/testing/custom-render`      | `customRender`, `customRenderAsync`, `customRenderServerAsync`, `renderElement` | the `[tenant]/[locale]/layout.tsx` stack (`@web/testing/providers`) |
  | `@platform/testing/custom-render` | `customRender`, `customRenderAsync`, `renderWithIntl`, `renderHookWithIntl`     | `NextIntlClientProvider`, `ToastProvider`, `UnsavedChangesProvider` |

  Bind `setup` once per file at module level:
  - **Sync component** → `customRender(Component, {…})`.
  - **Async Server Component or page** (`await Page({…})`) →
    `customRenderAsync(Page, {…})`, then `await setup(…)` — or
    `await expect(setup({…})).rejects.toThrow(…)` for a page that throws. In
    `apps/web`, a tree that nests further async Server Components needs
    `customRenderServerAsync`.
  - **Ad-hoc JSX** (compound children, a polymorphic `as`, a pre-built
    element) → `renderElement(<…>)`, or `renderWithIntl(<…>)` in
    `apps/platform`.
  - **A platform hook that reads its providers** → `renderHookWithIntl`.
  - **A platform component that reads `useSettingsFormState()`** →
    `customRenderInSettingsForm` (`@platform/testing/render-in-settings-form`,
    which wraps `SettingsFormProvider`) — never a stand-in provider written
    for one test file.

- **Repeated arrangement goes in `beforeEach` — mandatory.** When two or more
  `it`s in a `describe` open with the same line — a uniform `setup()`,
  `userEvent.setup()`, a fake's override, a fixture build, fake timers — that
  line moves into the `describe`'s `beforeEach`. A value the cases read
  (`user`, a fixture) is a `let` in the `describe`, assigned in `beforeEach`;
  anything it changes globally (fake timers, a stubbed global) is undone in
  `afterEach`. Arrangement that repeats its shape but varies per case is one
  named helper (`setup()`, `renderX()`), never copy-pasted. Each `it` keeps
  only what differs: an inline `setup({ overrides })` is not repetition —
  that is the factory's purpose. Never pair a `beforeEach` render with an
  inline one in the same `describe` (it double-renders); a genuinely
  different render gets its own `describe`, and a small variation is driven
  through the shared render where possible (an outside click is
  `fireEvent.mouseDown(document.body)`). **Blocking in review:** an arrangement line
  duplicated across `it`s, and the same `render(<X …/>)` prop bag three or
  more times in one file.

  ```tsx
  const setup = customRender(PostShare, defaultProps);

  describe(`<${PostShare.name}/>`, () => {
    beforeEach(() => {
      setup();
    });

    it('is closed by default', () => {
      expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });
  ```

## Writing a component test

The shape of every `@blog/ui`, `apps/web` and `apps/platform` component test.
It proves what the user sees and does through the accessibility tree, and
never reads state, props, handlers or markup shape.

- **Query ladder — in this order, no skipping down:**
  1. `screen.getByRole(role, { name })` for anything with a role — button,
     link, heading, textbox, list, img, dialog — always with the accessible
     name. A button is `getByRole('button', { name: 'Save' })`, never
     `getByText('Save')`, which hides a missing accessible name.
  2. `screen.getByText` for static copy with no role — a paragraph, a
     caption, a `<dd>`.
  3. `screen.getByTestId` last, when neither reaches the element: a fixed
     `data-testid` literal on the roleless element in the component
     (`hero-media`), or the root `dataTestId` prop (`IWithDataTestId`) when
     several same-role elements cannot be told apart. A test that needs a
     test id for a button or a link is reporting a markup bug
     (`react-component-practices` → "Accessible by construction").

  Scope with `within(element)`. No test asserts that a `dataTestId` is
  applied — querying by it already fails when it is missing.

- **Never drop to a raw DOM query.** `container.querySelector`,
  `document.querySelector`, a node walk (`el.parentElement`,
  `container.children`, `.firstChild`) and queries destructured from
  `render()` are replaced by a `screen` query (or `within(element)` to
  scope); an element nothing reaches gets a fixed `data-testid` in the
  component:

  ```tsx
  <span className={cursor()} aria-hidden="true" data-testid="cursor" />;
  expect(screen.getByTestId('cursor')).toHaveAttribute('aria-hidden', 'true'); // ✅
  expect(container.querySelector('[aria-hidden="true"]:empty')).toBeTruthy(); // ❌
  ```

  `testing-library/no-container`, `no-node-access` and
  `prefer-screen-queries` are errors in every `*.test.{ts,tsx}`
  (`configs/eslint/base.js`). A **chained** walk (`container.children[0]`,
  `el.parentElement.id`) slips past `no-node-access`; it is the same banned
  walk, caught by `code-review-practices` §0. The one legitimate
  `eslint-disable-next-line testing-library/no-node-access` is a
  structural-layout claim with no semantic handle (an image being a direct
  child of its frame), on that single line, with the reason in the `it`
  title.

- **Presence is `.toBeVisible()`; absence is `screen.queryBy*` +
  `.not.toBeInTheDocument()`.** Never `.toBeInTheDocument()` for presence
  (hidden still passes), never `getBy*` for absence (it throws first).
- **Name the element, then assert on the name.** Every queried element an
  `expect` checks is first bound to a `const` named for what it is, and
  `expect` takes that const — never a `screen` query inline. Absence and
  async read the same way:

  ```tsx
  const heading = screen.getByRole('heading', {
    level: 1,
    name: 'This sign-in link no longer works',
  });
  expect(heading).toBeVisible(); // ✅

  const subscribeButton = screen.queryByRole('button', { name: 'Subscribe' });
  expect(subscribeButton).not.toBeInTheDocument(); // ✅

  const confirmation = await screen.findByText('Check your inbox');
  expect(confirmation).toBeVisible(); // ✅

  expect(screen.getByRole('heading', { level: 1 })).toBeVisible(); // ❌
  ```

  The same holds for a query an interaction acts on: bind it, then pass the
  const. A query is never nested inside another call:

  ```tsx
  const blockSwitch = await screen.findByRole('switch', { name: 'Block' });
  await user.click(blockSwitch); // ✅

  await user.click(await screen.findByRole('switch', { name: 'Block' })); // ❌
  await user.click(screen.getByRole('button', { name: 'Save' })); // ❌
  ```

  **A test file you create or touch is converted whole** — every inline
  query assertion in it, not only the lines your change edits. Files the
  change does not touch stay as they are.

- **Interaction is `userEvent`, set up in `beforeEach`** (`user =
userEvent.setup()`), then `await user.click(…)`, `user.type(…)`,
  `user.keyboard('{Escape}')`. `fireEvent` only for an event `userEvent`
  cannot produce, such as an outside `mousedown` on `document.body`; a
  `fireEvent.click` is a finding.
- **Async is `findBy*` or `waitFor`**, never a manual `act` or a
  `setTimeout`. An `act` warning means a missing `await` on a `userEvent` call
  or a `findBy`.
- **Each case calls `setup(overrides)` and discards its return** — there is
  no `container` to reach into.
- **Assert the observable the prop changes** — `aria-current`, `disabled`, a
  rendered element, visible text. A prop whose only effect is styling has no
  test surface ("What not to test"). Never a snapshot.

```tsx
const setup = customRender(SubscribeForm, {
  heading: 'Get new posts by email',
  onSubscribe: vi.fn(),
});

describe(`<${SubscribeForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('subscribes the entered email', async () => {
    const onSubscribe = vi.fn();
    setup({ onSubscribe });

    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(onSubscribe).toHaveBeenCalledWith('jane@example.com');
  });

  it('replaces the form with the confirmation once subscribed', async () => {
    setup({ onSubscribe: vi.fn().mockResolvedValue(undefined) });

    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    const confirmation = await screen.findByText('Check your inbox');
    const subscribeButton = screen.queryByRole('button', { name: 'Subscribe' });

    expect(confirmation).toBeVisible();
    expect(subscribeButton).not.toBeInTheDocument();
  });
});
```

## What to fake

**Fake the edges of the app, never our own code.** An edge reaches outside
the process or the request: `@blog/service`, `@blog/db` (its `client` inside
`packages/db`), the Sanity query runner, tenant and auth resolution, `env`,
the logger, each app's `i18n/navigation`, Server Action modules (the
`'use server'` files under `src/server/`), `next/cache`, `next/navigation`,
`next-auth` and `next-auth/react`. Our components, `@blog/ui`, our helpers
and our context providers render for real. This holds in both apps.

- `SmartLink` is ours: fake `@web/i18n/navigation` under it, never
  `SmartLink`. A component calling `useToast` renders inside the real
  `ToastProvider` and the test asserts the toast on screen; never fake the
  hook.
- **Check the app's `src/vitest-setup.ts` before writing a `vi.mock`.** Both
  apps fake `next/navigation`, `next-intl/server` and `next/font/local` and
  stub `ResizeObserver` and `matchMedia` there (`apps/web` also
  `IntersectionObserver`), and every app fakes its shared logger there with
  its `__mocks__` copy; never mock those again. A test asserting a log line
  reads `vi.mocked(logger)`.
- **Never `vi.mock` an `@web/*`, `@platform/*` or `@blog/ui` component to test
  its parent.** Render the real child. One that will not render in jsdom gets
  the missing browser API stubbed once in the workspace's setup file, not the
  child faked per file.
- **Never read a fake's arguments to assert what a child receives** —
  `vi.mocked(Carousel).mock.calls.at(-1)[0]` tests wiring, not the result.
  Asserting an edge was called (`expect(getCta).toHaveBeenCalledWith('cta-1',
tenant)`) is fine: that call is the contract with the outside.
- **Two exceptions, both thin dispatchers whose children have their own
  tests:**
  - **A per-page module renderer** (`apps/web`'s `*-module-renderer.tsx`,
    which maps `_type` to a module and calls `renderModules` from
    `@web/modules/module-renderer`) may stub each module to render its id —
    rendering them for real would pull in every module's fakes.
  - **A route file** (`src/app/**/page.tsx`, `not-found.tsx`, either app) may
    stub the page component it renders and assert the params and props it
    hands over.
- **A shared edge fake lives in `__mocks__/` beside the module it
  replaces** (`server/tenant/tenant-base-url/__mocks__/tenant-base-url.ts`;
  `apps/platform`'s `server/auth/__mocks__/auth.ts`). Where one exists, a
  test writes a bare `vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url')`
  with no factory and Vitest picks it up, alias included. Export each fake
  as a `vi.fn()` with a sensible default.
  - **A `vi.mock` factory byte-identical in three or more files becomes a
    `__mocks__/` file** in the change that would write the third copy; until
    then an inline factory is fine. Two are already far past three copies,
    so the next test that needs one extracts it instead of writing another:
    db's `@blog/db/client` (`src/__mocks__/client.ts`), and service's
    `@blog/service/sanity/query/query` — a partial mock, because every loader
    needs the real `q` builder, so its `__mocks__/query.ts` spreads
    `vi.importActual(…)` and replaces only `runQuery`; `mockRun`
    (`@blog/service/testing/mock-run-query`) stays the typed handle.
  - **Never restate a `__mocks__` default in `beforeEach`** —
    `mockResolvedValue(MOCK_REQUEST_CONTEXT)`, the default auth session.
    Override only what the case changes.
  - **Override with the `Once` form, or call `vi.mocked(fn).mockReset()` in
    `beforeEach`** — it restores the `vi.fn(impl)` default; never re-set the
    default value. The preset's `clearMocks` clears calls but keeps an
    implementation a previous test set; `service`, `db`, `auth` and `email`
    set `mockReset: true`, which does the reset before every test.

## What not to test

- **Never assert the source back at itself.** A schema's field list, option
  list, default, fieldset, group, field order, title, icon or registry
  membership; a barrel "exposes X as a function"; an exported constant's
  value (passing the const as an input, or expecting the code under test to
  return it, is the required form — "Where tests live"); a component's static prop defaults; editor-facing copy — a
  `description`, label or placeholder pinned to its literal
  (`expect(displayModeField().description).toBe('Grid lays the posts out in rows. …')`);
  a field helper's default-vs-override precedence, which is `??`, not a
  contract. **If the expected value is a literal copied out of the file under
  test, delete the test.** Typegen, `type-check` and the Studio guard the
  shapes and the diff reviews the copy. If a field having _some_ description
  matters, assert it is non-empty, never its words.
- **A Studio schema definition gets no test at all.** Everything under
  `packages/studio/src/schema-types/{documents,objects,modules,fields}/` is
  declaration, its logic included: `required()`, a min/max, a `rule.custom`
  written inside the schema, a conditional `hidden`, a preview `prepare`, an
  `initialValue`, a field factory's branches. Each is read straight back out
  of the schema, visible the moment the Studio loads, and changed only on
  purpose. A schema change ships with `no-tests-needed`; what is testable in
  the Studio is under "What to test".
- **Sibling cases use `it.each`, never copied blocks** — three `it`s that
  differ only in an input and an expected value are one table-driven test.
- **Never assert a class — unconditional or prop-driven, no exceptions.** A
  Tailwind utility is the source restated: the expected string is copied out
  of the component's `tv()` definition, so the test fails on every restyle
  and passes on every visual regression that keeps the class name. "The
  class only appears when the prop is set" is still the variants map read
  back (`toHaveClass('hover:bg-brand-primary-muted')` gated on `link` is the
  case agents reach for most). What a prop-driven style _means_ has a
  semantic observable — `aria-current`, `aria-disabled`/`disabled`, `role`
  and the rendered element, visible text; assert that. When the prop's only
  effect is styling, Storybook covers it and the ticket carries
  `no-tests-needed`. A forwarded `className` is no exception — it is the
  `class: className` argument to the component's `tv()` call. The
  `no-class-assertions` rule (`configs/eslint/base.js`)
  fails `toHaveClass`, `.className`/`.classList` reads and `class`-attribute
  assertions in every `*.test.{ts,tsx}`, with no suppression baseline left.
- **No comments in a test file** other than the `@vitest-environment`
  docblock ("Per-package setup"). A "why this case exists" belongs in the
  `it` title, a "why this mock" in the helper's name. The one-line-gotcha
  exception of the general comment rule does not apply: a test with a gotcha
  worth a sentence has the wrong title or fixture. Every other added comment
  line in `*.test.ts(x)` is blocking in review.
- **No snapshots, no implementation details, no network calls.**
- **Never mock our own components** ("What to fake"). A test that only
  passes by faking a sibling `@blog/ui` component usually means the web
  component wraps the pure one instead of filling its slot — fix the
  structure (`web-component-practices`) and test the real tree.

## When you touch a test file (mandatory)

Test files carry no size budget, so this pass is what keeps them small.
Every test file a diff creates or edits is pruned in that diff — the whole
file, not only the cases the change adds. A test file the diff does not touch
is left alone; this is never a sweep.

- **A duplicate is deleted** — a test asserting the same behaviour as
  another test in the file, however its arrangement differs.
- **Behaviour another unit owns moves to that unit.** A case exercising a
  hook, provider or shared component that has its own test file moves there
  (or is deleted when that file already asserts it); the touched file keeps
  one wiring test proving it uses the unit.
- **Cases that differ only in input and expected output become one
  `it.each` table.**
- **A test "What not to test" bans is deleted** — a source-back assertion, a
  class assertion, a Studio schema test.

Report every test removed or moved with the test that still asserts its
behaviour (file and `it` title). A removal whose behaviour is asserted
nowhere else is blocking in review (`code-review-practices` §6), unless the
test was deleted for failing "What not to test". The reviewer's mechanical
scan names each touched test file over 500 lines, which gets this pass first.

## Coverage strategy

Many fast unit tests (`ui`, `service`, migrations), few heavier route tests.
Spend coverage on business-critical paths, edge cases (empty, null, limits),
error and empty handling, and data integrity/idempotency; skip trivial
getters, framework code, one-off scripts and declarative config. When adding
a feature, gap-scan: does each new critical path and each error/empty branch
have a test? Report gaps rather than leaving them silent.

## Checklist

- [ ] Co-located `*.test.ts(x)`; a test that renders JSX is `.tsx`; any
      other environment need is a `@vitest-environment` docblock.
- [ ] Rendered through the workspace's `testing/custom-render`.
- [ ] Only edges faked; shared fakes from `__mocks__/`, defaults not restated;
      no network, no real time.
- [ ] Fixtures from `testing/` builders; inputs and expectations use existing
      consts; no value written twice; no const's own value asserted.
- [ ] A new exported fixture is `mock<Thing>()` or `MOCK_<THING>`.
- [ ] Queried by role, then text; asserts behaviour, not implementation.
- [ ] No asymmetric matcher (`expect.objectContaining`, `expect.any`, …) inside
      an assertion; every expected value is exact.
- [ ] Every asserted element is a named `const`; no `screen` query inside
      `expect(…)` anywhere in a file the change creates or touches.
- [ ] Every `it` title is behaviour, 80 characters or fewer.
- [ ] No arrangement repeated across `it`s; no prop bag rendered 3+ times.
- [ ] Every touched test file pruned: no duplicate, no case another unit
      owns, no untabled repeat; each removal reported with where its
      behaviour is still asserted.
- [ ] Migrations: transform correctness + idempotency.
- [ ] `pnpm --filter <pkg> test` passes.
