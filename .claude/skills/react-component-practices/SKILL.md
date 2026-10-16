---
name: react-component-practices
description: Use when writing or changing any React component in packages/ui, apps/web or apps/platform — a new component, a prop added, state introduced, an effect, a memo, a ref, a list, a form control — before the layer-specific skill (ui-library-practices, web-component-practices) is applied.
---

# React component practices (shared by `ui`, `web`, `platform-app`)

The rules every React layer shares. The layer guides build on them and repeat
none of them: `ui-library-practices` (`packages/ui`),
`web-component-practices` (`apps/web` client islands), `platform-ui-practices`
and `platform-app.md` (`apps/platform`). Component tests follow
`testing-practices` → "Writing a component test".

## Server first, client at the leaf

- A component is a Server Component until it needs a hook, a browser API or
  an event handler. Then `'use client'` goes on the smallest component that
  needs it — never on a page, a layout or a section that only renders
  children (`packages/ui` never carries it: CLAUDE.md → Conventions).
- A view gets its data as props. Fetching happens in an async Server
  Component — a page composition, a web `*-module.tsx`, a layout shell such
  as the site header, a platform section (`platform-ui-practices` → "Data
  loading") — which hands typed props to a view that only renders.
- A `'use client'` component never calls a `@blog/service` loader, a
  `@blog/db` query or `fetch()` (a type or constant import is fine). Data it
  loads on demand comes through a Server Action (`platform-ui-practices` →
  "Data loading"). No component reads `process.env`.

## Where a component lives

`packages/ui` places by atomic layer (`ui-library-practices` → "Atomic Design
layering"). In `apps/web` and `apps/platform`, actual reuse decides — never
how general a component looks:

| Who imports it                      | Where it lives                                                  |
| ----------------------------------- | --------------------------------------------------------------- |
| One consumer                        | `<consumer>/components/<name>/`, no barrel; it imports the file |
| Only another shared component       | that component's `components/<name>/`                           |
| Several consumers inside one domain | the domain's level: `components/features/<domain>/<name>/`      |
| Two or more distinct domains        | `components/shared/<name>/`                                     |

A domain is a module, a feature, a page, or a layout or app route.

- A component moves into `shared/` in the change that adds its second domain.
- A single-domain component in `shared/` moves to its domain in the change
  that touches it. Never as a sweep.
- Each app's folder set (`pages/`, `page-templates/`, `modules/`, barrels):
  `web.md` / `platform-app.md` → "File organisation".

## Props

### Contract

- One explicit, named declaration listing every field: `type T{X}Props` in
  `packages/ui` (never an `interface` there) and `apps/platform`;
  `interface I{X}Props` in `apps/web`, a new file included (older files on
  `type T{X}Props` stay as they are). Never inline, never a
  `ComponentProps<'div'>` spread, never `...rest` onto the DOM — forward
  exactly the attributes the component means to (`className`, `dataTestId`,
  an `aria-*` it owns). Two exceptions: a polymorphic `as` component
  (`ui-library-practices` → "Polymorphism") and a Base UI `render` target such
  as platform's `Link` (`platform-ui-practices` → "Props").
- An object prop gets a named type too — one that already exists where it
  can (`TStagedImage`, a store record, a theme type), never a new bag copying
  its fields.
- A boolean is a state: `isOpen`, `isDisabled`, `hasImage` — never `open`,
  `disabled`, `image?: false`. A callback is an event (`onSelect`, `onClose`,
  `onSubmit`), called with the value the parent needs, not the React event.
- A prop is optional only when the render branches on it
  (`{caption && …}` ⇒ `caption?: string`). A default lives in the
  destructure (`{ size = SIZE.MD }`), never in a `??` deep in the body.
- A closed set of values is typed from its source — `TValueOf<typeof C>` of a
  `@blog/config` const, or the `tv()` variants type
  (`variant?: TNavLinkVariants['variant']`) — never a hand-written union.
- Props forwarded unchanged through two or more layers, or hand-bundled into
  a local object, become one object prop typed from their source. A view
  receives its view-model whole (`<CtaModuleView module={data} />`), never
  `{...result.data}` spread in and re-destructured.
- Copy in `@blog/ui` stays one flat `…Label` prop per string; no step of the
  ladder below drops or bundles it.

### The ceiling

- **7 props in `apps/platform`; 10 in `packages/ui` and `apps/web`.** Count
  every member of the props type: optional ones, `children`, `className`, and
  the members the `IWithClassName`/`IWithDataTestId` mixins add.
- Exempt, and only these: the native-attribute primitives `Button`,
  `IconButton`, `TextInput` and `TextLink` in `@blog/ui`, and `Button` and
  `TextInput` in `apps/platform`.
- A component at the ceiling takes no new prop until it is restructured — in
  the same PR or one before it.
- Over the ceiling, or about to be, use the first step that fits:
  1. **Drop.** Derived one-to-one from another prop (a label from `kind`,
     `isRejected` from `value`) → derive it inside. Filled the same way by
     every caller (`hasArrow={true}`) → the component owns it; in an app that
     includes one translated string or one Server Action (the component calls
     `useTranslations` or imports the action). Passed only by a test (`as`,
     an injected action) → delete it; the test `vi.mock`s the module.
  2. **Group.** Fields that always travel together → one object typed from
     their source (`owner: { email, joinedAt }`, `theme`, `record`).
  3. **Slot.** Several props configuring one region (a footer button with its
     pending and disabled flags) → one `ReactNode` slot or a compound part
     (`Card.Header`; `ui-library-practices` / `platform-app.md` → "Compound
     components").
  4. **Hook.** State plus handlers every caller builds by hand → a
     `use<Name>` hook the component calls, or whose result it takes as one
     object ("Size and splitting" says where it lives).
  5. **Context.** Values that reach several components at different depths,
     or pass through one that never reads them → a provider at their lowest
     common ancestor. Never for one reader or to skip one hop. Placement:
     `web.md` → "File organisation", `platform-ui-practices` → "Props".

## State: least of it, lowest it can go

- **Derive, don't mirror.** Anything computable from props or other state is
  computed in render — `const isEmpty = items.length === 0` — never copied
  into `useState` and kept in sync with `useEffect`. An effect that only sets
  state from props goes, along with that state.
- State lives on the lowest component that owns the behaviour; lift it only
  to the nearest common parent that needs it. A page holds no state a section
  could hold.
- Controlled **or** uncontrolled, decided per component: the parent owns the
  value (`value` + `onChange`, no internal copy) or the component does
  (`defaultValue`, no `value` prop) — never both, never a prop that "syncs"
  one into the other.
- `useEffect` synchronises with something outside React — a subscription, a
  DOM measurement, a browser API — and returns its cleanup. Never to respond
  to a prop change, to call a callback on mount, or to chain state updates.
- A `ref` is for DOM access (focus, measurement, scroll) or a mutable value
  that must not cause a render — never a second state store.
- **A context's `use<Name>()` hook throws outside its provider — every one.**
  Default the context to `undefined` and throw
  `'use<Name> must be used within a <Name>Provider'` when `useContext`
  returns it. Never a fallback value or a `?.` read that quietly does nothing:
  a missing provider is a wiring bug a fallback hides until a user meets it.
  A component that must also work without the provider gets one from its
  caller (with the "nothing applies" value); tests and stories wrap it too.

## Composition over configuration

- A component growing a third boolean prop to change what it renders wants a
  slot: take `children` or a named `ReactNode` slot, or split into a compound
  (`MediaCard.Media`, `Panel.Body`; `ui-library-practices` → "Compound
  components").
- A repeated block is a list over data with a **stable key** — the entity's id
  or slug, never the array index or the render position. A key that changes
  remounts the subtree and loses its state.
- A conditional that picks between whole components is a ternary or an early
  `return null`, never `display: none` on both.

## Styling files

- A component's `tv()` is a module-scope const in its own `.tsx` (class
  strings inline in JSX stay banned). Derive its `T{X}Variants`
  (`VariantProps<typeof xVariants>`) beside the `tv()`, wherever that lives;
  export it once another file imports it — knip fails an unused export.
- A separate `<name>-variants.ts`, or a recipe in
  `packages/ui/src/lib/styling/`, exists only once a second component imports
  it. Every importer counts: a compound-slot sibling, a consumer in another
  workspace (`apps/web` importing `nav-link-variants` by path), an import
  through the `@blog/ui/lib/styling` barrel.
- The change that adds the second consumer extracts the `tv()` into that file.
- A diff that touches a component whose variants file has one consumer folds
  the `tv()` back into the `.tsx` in that change. Never as a sweep.
- **`packages/ui` exception:** every component there with a `tv()` of its
  own, a new one included, keeps it in a sibling `<component>-variants.ts`,
  because `scripts/gen-ui-index.mjs` reads that file to build
  `COMPONENTS.md`; a component that applies no classes of its own has none.
  The exception ends when the generator reads an inline `tv()`. A
  `lib/styling/` recipe follows the rule above.

## Size and splitting

The budgets, and extracting the part a diff changes, are CLAUDE.md → "File
size budgets". What to extract, and where it goes:

| Signal in the file                                      | Extract to                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A closure that returns JSX                              | A component in `components/<child>/` ("Where a component lives")                |
| A state-plus-handler cluster, or an effect with cleanup | A co-located `use-<name>.ts`                                                    |
| A pure derivation over ~10 lines, or used twice         | `utils/<name>/<name>.ts` (helper homes: `.claude/agents/config.md` → "Helpers") |
| An async Server Component that builds its view-model    | A `to-<x>` util; the component fetches, maps and hands the result to its view   |

A hook with one consumer is `use-<name>.ts` in that component's folder; a
shared component's own hook stays in its folder
(`settings-form-shell/use-settings-draft.ts`). When a second component
consumes it, it moves to `apps/web/src/hooks/use-<name>/` (with an
`index.ts` barrel) or `apps/platform/src/utils/use-<name>/`.

## Performance is measured, not assumed

- No `memo`, `useMemo` or `useCallback` without a measured re-render problem
  named in the PR — a hand-placed memo is a maintenance cost with no observed
  benefit.
- A list that renders hundreds of rows gets pagination or virtualisation in
  the design, not a memo on the row.

### Vercel's React rules — which apply here

Load the `vercel:react-best-practices` plugin skill for performance work in
`apps/web` or `apps/platform` — a slow route, a request waterfall, a heavy
client bundle, a re-render problem — and when reviewing a Server Component
that fetches. Where it disagrees with this repo, this repo wins.

Apply as written:

- **Waterfalls** — `async-parallel`, `async-defer-await`,
  `async-suspense-boundaries`, `server-parallel-fetching`: independent
  fetches start together; a slow one streams behind its own `Suspense`.
- **The RSC boundary** — `server-serialization`, `server-dedup-props`: pass a
  client component only the fields it renders, never a whole service result.
- **Server work** — `server-cache-react` for a lookup several components on
  one request make, `server-after-nonblocking` for logging or side effects the
  response doesn't wait on, `server-auth-actions` for every Server Action.
- **Client bundle** — `bundle-dynamic-imports`, `bundle-defer-third-party`,
  `bundle-barrel-imports`. A component folder's `index.ts` re-exporting its
  one component is not a barrel in that rule's sense: import the component
  through the folder (`@blog/ui/components/atoms/button`), never
  `<name>/<name>.tsx`. A `-variants.ts` (which that `index.ts` leaves out)
  and a child folder with no barrel are imported by path. The
  `@blog/ui/lib/styling` entry is the required way to import `tv` and its
  recipes, and is exempt. Any other barrel re-exporting many modules can pull
  `server-only` code into the client graph.
- **Re-renders that are really design** — `rerender-derived-state-no-effect`,
  `rerender-no-inline-components`, `rerender-move-effect-to-event`,
  `rerender-lazy-state-init`.

Overridden here:

- **Every memo rule** (`rerender-memo`, `rerender-memo-with-default-value`,
  `rerender-simple-expression-in-memo`) — a Vercel rule is not the
  measurement the rule above requires.
- **`server-cache-lru`** — caching across requests goes through Next's cache
  (`vercel:next-cache-components`), never a module-level cache.
- **`client-swr-dedup`** — this repo doesn't use SWR.

## Accessible by construction

- Every clickable thing is a `<button>` (action) or an `<a>`/`Link`
  (navigation) with an accessible name — never an `onClick` on a `div` or a
  `span`. Every input has a `<label>`. Every image has `alt` (empty for
  decorative). Every icon-only control has `aria-label`.
- The accessible name is the test's handle: write the component so
  `screen.getByRole('button', { name })` reaches it. A component a test can
  only find by `data-testid` has wrong markup; the fixed `data-testid` is for
  a genuinely roleless element (a media slot, a decorative wrapper).
- **A DOM id comes from `useId()`** (or the Base UI part that generates it),
  never a hand-written string (`id="tenant-name"`) or a template built from
  content (`` `cta-${key}` ``) — both collide when the component renders
  twice. A suffix on a `useId` base (`` `${id}-hint` ``) is fine. When another
  component needs the id (an in-page `#id` link), generate it in their common
  owner and pass it down.
- Layer rules: `ui-library-practices` → "Accessibility rules",
  `platform-app.md` → "Base UI is the behaviour layer",
  `platform-ui-practices` → "Forms and settings".

## Red flags — stop and restructure

| You are about to write…                                   | Do this instead                                      |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `useEffect(() => setX(propX), [propX])`                   | Use `propX` directly, or derive in render            |
| `const [count, setCount] = useState(items.length)`        | `const count = items.length`                         |
| `onClick` on a `div`                                      | `<button type="button">`                             |
| `key={index}`                                             | `key={item.id}`                                      |
| `value` **and** `defaultValue` on the same component      | Pick controlled or uncontrolled                      |
| `useCallback` "just in case"                              | Plain function; memo only with a measurement         |
| `open?: boolean`, `image?: false`                         | `isOpen?: boolean`, `hasOwnImage?: boolean`          |
| `'use client'` at the top of a page                       | Move it to the leaf that needs the hook              |
| `data-testid` on a button so the test can find it         | Give the button its accessible name                  |
| `id="field-name"` or ``id={`cta-${key}`}``                | `const id = useId()`                                 |
| A new component in `shared/` that one domain imports      | Put it with its consumer ("Where a component lives") |
| A `*-variants.ts` in an app that only its component reads | Keep the `tv()` in the `.tsx`                        |
| An 8th platform prop, an 11th `ui`/`web` prop             | Drop → group → slot → hook → context first           |
| `<CtaModuleView {...result.data} />`                      | `<CtaModuleView module={result.data} />`             |
