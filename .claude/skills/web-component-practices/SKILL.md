---
name: web-component-practices
description: Use when building or editing an interactive component in apps/web — popover, dropdown, menu, disclosure, tabs, toggle, clipboard, focus trap, outside-click/Escape handling — or composing a pure @blog/ui component with client state. Apply the moment you add 'use client' + useState/useEffect + document.addEventListener/getElementById/querySelector to a component.
---

# Web component practices (apps/web)

`apps/web` is where pure `@blog/ui` meets client interactivity. These rules
keep that boundary clean. They sit on top of `react-component-practices`
(server first, `useId`, props, state, styling files, placement, size), which
they do not repeat.

## Rule 1 — slot in, never wrap

A pure `@blog/ui` component that shows an interactive element exposes a
`ReactNode` slot. Build the widget as a `'use client'` leaf in `apps/web` and
pass it **into** the slot — never wrap the pure component and re-forward its
props.

```tsx
// ✅ web builds the widget; PostMeta renders one opaque slot child
<PostMeta author={post.author} share={<PostShare url={url} title={post.title} links={shareLinks} />} />

// ❌ a "share" component that owns PostMeta and tunnels a state bag through it
<PostShareButtons author={post.author} publishedAt={…}
  share={{ open, onOpenChange, isCopied, triggerRef, … }} />
```

**Self-check:** a component that takes another component's data props
(`author`, `publishedAt`) _plus_ a bag of interactive state, or whose test
only passes with a faked `@blog/ui` component, wrapped where it should have
slotted in (`testing-practices` → "What to fake"). The `@blog/ui` side of
this rule is `ui-library-practices` → "Component conventions".

## Rule 2 — client behaviour in ref-based hooks

Outside-click, Escape, focus trap and clipboard go in small hooks keyed off
**refs** — never in the component body via `getElementById`, ad-hoc
`document` listeners or a document-wide `querySelectorAll`. `src/hooks/`
already ships `usePopover`, `useDismissibleMenu` and `useCopyToClipboard`;
reuse before writing one.

```tsx
// ✅ the body wires refs and reads results
const { open, toggle, triggerRef, panelRef } = usePopover();
const { isCopied, copy } = useCopyToClipboard();

// ❌ imperative DOM in the body — this is what broke focus return on the share popover
document.getElementById(id); document.addEventListener('mousedown', …);
```

The listeners still exist — inside the hook's `useEffect`, scoped to a ref
(`panelRef.current`), cleaned up on unmount, and unit-testable on the hook. A
component body that touches `document` directly is the smell.

## Rule 3 — split a growing island at its state branches

A client island that renders genuinely different UI per state (loading /
signed-out / signed-in; empty / populated; idle / a multi-step sub-flow)
splits as soon as one file mixes _which branch am I in_, _what this branch
renders_ and _how this sub-flow manages its state_ — even under the size
budget. Budgets are CLAUDE.md → "File size budgets"; the general extraction
signals, and where hooks and helpers go, are `react-component-practices` →
"Size and splitting". The island's own cut:

- **Each mutually exclusive top-level branch** → its own child in
  `components/<branch>/`. The parent becomes a thin dispatcher: it reads the
  session/loading state, owns only what every branch shares (here the one
  `usePopover()`), and renders the matching child.
- **A sub-flow's state machine** (its `useState`s, effects and the handler
  tying them together) → a `use-<flow>.ts` beside the component that calls
  it, even with one caller. Test the state machine on the hook, not through
  the parent's rendered output.

`AuthMenu` models the cut:

```
auth-menu/
  auth-menu.tsx           # dispatcher: Spinner | AccountMenu | SignInMenu
  auth-menu-variants.ts   # `panel` (both menus) + `statusIndicator` (dispatcher only — a leftover)
  components/
    account-menu/
      account-menu.tsx    # signed-in branch
    sign-in-menu/
      sign-in-menu.tsx    # signed-out branch, composes useEmailSignIn
```

Its leftovers predate the `react-component-practices` rules — don't copy
them. A diff that touches one fixes it:

- AuthMenu sits in `shared/` with a barrel, though only `site-header`
  imports it → `site-header/components/auth-menu/` ("Where a component
  lives").
- `use-email-sign-in.ts` sits in a one-entry `hooks/` → beside
  `sign-in-menu.tsx`.
- `statusIndicator`, and each menu's single-consumer `*-variants.ts` → a
  `tv()` in the `.tsx` that renders them ("Styling files").
- The popover state reaches each menu as five forwarded props (`panelId`,
  `isOpen`, `toggle`, `triggerRef`, `panelRef`) → one object typed from its
  source ("Props").

Below the budget, don't split a component that has one render path and
straightforward state.

## Rule 4 — reach for a `@blog/ui` atom before a raw HTML element

If `@blog/ui` ships an atom for the element — `Button`, `IconButton`,
`TextInput`, `Avatar` — use it, even for a small disabled or loading control.
Bare markup in `apps/web` is the exception: a framework-coupled wrapper
(`SmartLink`, `SanityImage`) or a capability the atom's prop type genuinely
lacks. Atoms take closed prop types with state-named booleans (`Button` takes
`isDisabled`, not `disabled`), so read the prop type before deciding it can't
do the job.

```tsx
// ❌ a parallel implementation of Button
<button type="button" disabled={emailStep === 'submitting'} onClick={handleEmailSubmit} className={…}>

// ✅ sign-in-menu.tsx
<Button size={SIZE.SM} isDisabled={emailStep === 'submitting'} onClick={handleEmailSubmit}>
```

## Rule 5 — merge Portable Text component maps, never spread them

`PortableText` owns the design-system component map; a caller's overrides
combine with it rather than replace it. Every combination — the library's
`defaultComponents`, ours, a caller's — goes through `mergeComponents` from
`@portabletext/react`. **Object spread is banned here outright, at every
layer**, and hand-building one category counts as spreading.

```tsx
// ✅ merges per category: overriding marks.code keeps marks.strong (library) and marks.linkRef (ours)
const baseComponents = mergeComponents(defaultComponents, portableTextComponents);
mergeComponents(baseComponents, components);

// ❌ replaces the whole category: a caller passing any `marks` silently drops strong, em and linkRef
{ ...baseComponents, ...components }
{ marks: { ...baseComponents.marks, ...components.marks } }  // same bug, hand-built
```

**Nothing fails** when this breaks: every field on `PortableTextComponents`
is optional, so dropping `marks.strong` type-checks, lints and passes every
existing test, and surfaces only as unstyled text in production. The
coverage has to be behavioural — a test that overrides **one** entry in a
category and asserts the **other** entries in that category still render
(`portable-text.test.tsx`, "keeps the default strong mark when a caller
overrides the code mark").

## Also

- Props, including passing a view-model whole (`author={post.author}`):
  `react-component-practices` → "Props". When a view-model field won't
  type-check against a `@blog/ui` prop, rename the prop
  (`ui-library-practices` → "Shape data props to the view-model you're fed").
- Which file holds the `tv()`, including after a split:
  `react-component-practices` → "Styling files"; class grouping:
  `ui-library-practices` → "Styling".
