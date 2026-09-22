---
name: react-component-practices
description: Use when writing or changing any React component in packages/ui, apps/web or apps/platform — a new component, a prop added, state introduced, an effect, a memo, a ref, a list, a form control — before the layer-specific skill (ui-library-practices, web-component-practices) is applied.
---

# React component practices (shared by `ui`, `web`, `platform-app`)

The rules every React layer shares. The layer skills add their own on top —
`ui-library-practices` for `packages/ui`'s purity, closed prop types, `tv()`
and JSDoc contract; `web-component-practices` for `apps/web`'s client
islands; `platform-app.md` for `apps/platform`'s Base UI forms — and none of
them repeat what is here. Tests for these components follow
`testing-practices` → "Writing a component test".

## Server first, client at the leaf

- A component is a Server Component until it needs a hook, a browser API or
  an event handler. Then `'use client'` goes on the smallest component that
  needs it — never on a page, a layout or a section that only renders
  children. `packages/ui` never carries the directive at all (its consumer
  declares the boundary).
- Data comes in as props. A component never fetches, never reads `process.env`
  and never imports `@blog/service`/`@blog/db` below the route level; the
  route fetches and passes typed props down.

## Props are a closed, named contract

- Props are one explicit, named declaration with every field listed —
  `type TFooProps` in `packages/ui` (never `interface` there, per
  `ui-library-practices`), the layer's existing form elsewhere (`apps/web`
  declares `interface IFooProps`). Never inline, never a
  `ComponentProps<'div'>` spread, never `...rest` onto the DOM — a component
  forwards exactly the attributes it means to (`className`, `dataTestId`, an
  `aria-*` it owns).
- A boolean is a state, named as one: `isOpen`, `isDisabled`, `hasImage` —
  never `open`, `disabled`, `image?: false`. A callback is an event:
  `onSelect`, `onClose`, `onSubmit`, and it is called with the value the
  parent needs, not the React event.
- An optional prop is one the render actually branches on
  (`{caption && …}` ⇒ `caption?: string`); a prop the component always uses is
  required. A default lives in the destructure (`{ size = 'md' }`), not in a
  `??` deep inside the body.
- A closed set of values is typed from its source — a `@blog/config`
  UPPERCASE const's derived union, or the `tv()` variants type
  (`variant?: TNavLinkVariants['variant']`) — never a hand-written string
  union that drifts from it.

## State: least of it, lowest it can go

- **Derive, don't mirror.** Anything computable from props or other state is
  computed in render — `const isEmpty = items.length === 0` — never copied
  into `useState` and kept in sync with `useEffect`. If an effect exists only
  to set state from props, delete both and derive.
- State lives on the lowest component that owns the behaviour; lift it only
  to the nearest common parent that needs it, and no higher. A page holds no
  state a section could hold.
- Controlled **or** uncontrolled, decided per component: either the parent
  owns the value (`value` + `onChange`, no internal copy) or the component
  does (`defaultValue`, no `value` prop) — never both, never a prop that
  "syncs" one into the other.
- `useEffect` is for synchronising with something outside React — a
  subscription, a DOM measurement, a browser API — and it returns its
  cleanup. Not for responding to a prop change, not for calling a callback
  on mount to "initialise", not for chaining state updates.
- A `ref` is for DOM access (focus, measurement, scroll) or a mutable value
  that must not cause a render. Never as a second state store.

## Composition over configuration

- A component that grows a third boolean prop to change what it renders is
  asking for a slot: take `children` or a named `ReactNode` slot, or split
  into a compound (`Card.Media`, `Card.Body`). See `ui-library-practices` →
  "Compound components" for the mechanics.
- A repeated block is a list over data with a **stable key** — the entity's
  id or slug, never the array index and never a key built from the render
  position. A key that changes remounts the subtree and loses its state.
- A conditional that picks between whole components is a ternary or an early
  `return null`, never `display: none` on both.

## Performance is measured, not assumed

- No `memo`, `useMemo` or `useCallback` without a measured re-render problem
  named in the PR. Four files in the whole repo use one today; a hand-placed
  memo is a maintenance cost with no observed benefit.
- A list that renders hundreds of rows gets pagination or virtualisation in
  the design, not a memo on the row.

## Accessible by construction

- Every clickable thing is a `<button>` (action) or an `<a>`/`Link`
  (navigation) with an accessible name — never an `onClick` on a `div` or a
  `span`. Every input has a `<label>`. Every image has `alt` (empty for
  decorative). Every icon-only control has `aria-label`.
- The accessible name is the test's handle: the component is written so that
  `screen.getByRole('button', { name })` reaches it. A component that a test
  can only find by `data-testid` is one whose markup is wrong, not one that
  needs a test id — the fixed `data-testid` is reserved for a genuinely
  roleless element (a media slot, a decorative wrapper).
- Layer-specific rules: `ui-library-practices` → "Accessibility rules",
  `platform-app.md` → forms and Base UI.

## Red flags — stop and restructure

| You are about to write…                              | Do this instead                              |
| ---------------------------------------------------- | -------------------------------------------- |
| `useEffect(() => setX(propX), [propX])`              | Use `propX` directly, or derive in render    |
| `const [count, setCount] = useState(items.length)`   | `const count = items.length`                 |
| `onClick` on a `div`                                 | `<button type="button">`                     |
| `key={index}`                                        | `key={item.id}`                              |
| `value` **and** `defaultValue` on the same component | Pick controlled or uncontrolled              |
| `useCallback` "just in case"                         | Plain function; memo only with a measurement |
| `open?: boolean`, `image?: false`                    | `isOpen?: boolean`, `hasOwnImage?: boolean`  |
| `'use client'` at the top of a page                  | Move it to the leaf that needs the hook      |
| `data-testid` on a button so the test can find it    | Give the button its accessible name          |
