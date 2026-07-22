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

## Also

- Pass view-models through (`author={post.author}`), don't hand-map fields — if
  it doesn't type-check, align the pure component's prop names in
  `ui-library-practices` → "Shape data props to the view-model".
- `'use client'` stays on the smallest interactive leaf (CLAUDE.md conventions).
- Testing an inverted composition needs a fake `@blog/ui` mock — that mock is
  the signal to slot-in instead (`testing-practices`).
