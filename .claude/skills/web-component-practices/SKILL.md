---
name: web-component-practices
description: Use when building or editing an interactive component in apps/web — popover, dropdown, menu, disclosure, tabs, toggle, clipboard, focus trap, outside-click/Escape handling — or composing a pure @blog/ui component with client state. Apply the moment you add 'use client' + useState/useEffect + document.addEventListener/getElementById/querySelector to a component.
---

# Web component practices (apps/web)

`apps/web` is where pure `@blog/ui` meets client interactivity. Two rules keep
that boundary clean; both were violated on the share-popover branch (#620).

## Rule 1 — slot in, never wrap

A pure `@blog/ui` component that shows an interactive element exposes a
`ReactNode` slot. Build the widget as a `'use client'` leaf in `apps/web` and
pass it **into** the slot — never wrap the pure component and re-forward its
props.

```tsx
// ✅ web builds the widget; the pure component renders one opaque slot child
<PostMeta author={post.author} share={<PostShare url={url} links={links} />} />

// ❌ "share" component owns PostMeta + tunnels a controlled-props bag through it
<PostShareButtons author={post.author} publishedAt={…}
  share={{ open, onOpenChange, isCopied, triggerRef, … }} />
//   → confusing name vs. job, drills ~10 props PostMeta never reads,
//     forces vi.mock('@blog/ui') to test (see testing-practices)
```

**Self-check:** taking another component's data props (`author`, `publishedAt`)
_plus_ a bag of interactive state = you wrapped when you should have slotted in.

## Rule 2 — client behaviour in ref-based hooks

Outside-click, Escape, focus-trap, and clipboard go in small colocated hooks
keyed off **refs** — not in the component body via `getElementById` / ad-hoc
`document` listeners / document-wide `querySelectorAll`.

```tsx
// ✅ component body wires refs, reads results
const { open, toggle, triggerRef, panelRef } = usePopover();
const { isCopied, copy } = useCopyToClipboard();

// ❌ imperative DOM in the body (caused the focus-return bug on #620)
document.getElementById(id); document.addEventListener('mousedown', …);
```

The listeners still exist — but inside a hook's `useEffect`, scoped to a `ref`
(`panelRef.current`, not `getElementById`), cleaned up on unmount, and unit-
testable. A component body that touches `document` directly is the smell.
Generate the `aria-controls` id with `useId()`, not a hardcoded default.

## Rule 3 — split a growing island by context, not one file per concern

A client island that renders genuinely different UI per state (loading vs.
logged-out vs. logged-in; empty vs. populated; idle vs. a multi-step sub-flow)
stays a single file only while it's small. Once one file is mixing "which
branch am I in" with "what does this branch render" with "how does this one
sub-flow manage its own state", split it — this was missed on `AuthMenu`
(#1107), which grew to 320 lines carrying a pure helper, a fully separate
logged-in render tree, a fully separate logged-out render tree, and an
inline-expanding email sub-flow's own four-piece state machine, all in one
file.

Split along **context boundaries**, not arbitrary line counts:

- **A pure helper with no JSX** (derives a value, no hooks) → its own file,
  co-located in the component's folder (`to-session-username.ts`, tested
  directly, not only indirectly through the component that calls it).
- **A self-contained sub-flow's state** (its own `useState`s, `useEffect`s, and
  the handler that ties them together) → its own hook
  (`use-email-sign-in.ts`), even if only one component calls it. The test for
  "does this state machine work" belongs on the hook, not re-derived through
  the parent component's rendered output.
- **Each mutually-exclusive top-level render branch** (logged-in vs.
  logged-out) → its own sub-component (`account-menu.tsx`, `sign-in-menu.tsx`)
  in the same folder. The parent file becomes a thin dispatcher: read
  session/loading state, render the matching sub-component, nothing else.

```
src/components/shared/auth-menu/
  auth-menu.tsx              # dispatcher: loading | AccountMenu | SignInMenu
  account-menu.tsx           # logged-in render tree
  sign-in-menu.tsx           # logged-out render tree, composes the hook below
  use-email-sign-in.ts       # the email sub-flow's state machine
  to-session-username.ts     # pure helper, tested directly
  auth-menu-variants.ts
  auth-menu.test.tsx          # + co-located tests for the split-out pieces
  index.ts                    # re-exports AuthMenu only
```

This is the same "extract at the second repetition" discipline
(`.claude/agents/web.md`) applied one level earlier — a single component
mixing three-plus contexts is itself the second-repetition signal, even
without a second caller. Don't split a component that only has one render
path with straightforward state; splitting there fragments things for no
reason. The signal is genuine context boundaries within one file, not size
alone.

## Also

- Pass view-models through (`author={post.author}`), don't hand-map fields — if
  it doesn't type-check, align the pure component's prop names in
  `ui-library-practices` → "Shape data props to the view-model".
- `'use client'` stays on the smallest interactive leaf (CLAUDE.md conventions).
- Testing an inverted composition needs a fake `@blog/ui` mock — that mock is
  the signal to slot-in instead (`testing-practices`).
- `apps/web` components follow the same `{component-name}-variants.ts` +
  `tv()` conventions as `packages/ui` — including comment discipline. A
  non-obvious magic number (a sticky offset, a `scroll-mt` value) gets a
  1–3 line comment stating the value and the one non-obvious fact behind it,
  never a multi-paragraph essay re-deriving the layout — this has recurred on
  `apps/web` variants files specifically. Full rule + before/after example:
  `ui-library-practices` → "Group classes by concern".
