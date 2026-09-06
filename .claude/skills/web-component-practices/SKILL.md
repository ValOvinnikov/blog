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

Once a split produces **two or more** files of the same kind, group them into
a matching subfolder rather than leaving everything flat at the top level —
a flat folder with a dispatcher, two render branches, a hook, and a helper
side by side is exactly the "crowded" problem this rule exists to fix one
level up, just recreated inside the folder instead of inside one file. Mirror
`@blog/ui`'s own compound-component precedent (`Panel`'s
`components/header/`, `components/body/`, each sub-part in its own folder
under `components/`, no barrel export since they're never imported from
outside the parent) and this repo's existing top-level
`src/hooks/` vs. `src/utils/` distinction — a stateful hook is not a "util,"
even when, as here, it's private to one component rather than promoted to
the shared top-level folder:

```
src/components/shared/auth-menu/
  auth-menu.tsx                    # dispatcher: loading | AccountMenu | SignInMenu
  auth-menu-variants.ts            # shared styling contract for the whole island
  auth-menu.test.tsx
  index.ts                         # re-exports AuthMenu only
  components/
    account-menu/
      account-menu.tsx             # logged-in render tree
    sign-in-menu/
      sign-in-menu.tsx             # logged-out render tree, composes the hook below
  hooks/
    use-email-sign-in.ts           # the email sub-flow's state machine
    use-email-sign-in.test.tsx
  utils/
    to-session-username.ts         # pure helper, tested directly
    to-session-username.test.ts
```

A single split-out file of a given kind stays at the top level — don't create
a one-entry `hooks/`/`utils/`/`components/` folder pre-emptively "for
consistency." The subfolder earns its place at the second file of that kind,
same as the parent split earning its place at the second context in one file.

This is the same "extract at the second repetition" discipline
(`.claude/agents/web.md`) applied one level earlier — a single component
mixing three-plus contexts is itself the second-repetition signal, even
without a second caller. Don't split a component that only has one render
path with straightforward state; splitting there fragments things for no
reason. The signal is genuine context boundaries within one file, not size
alone.

**Variants split the same way components do.** A single shared
`{island}-variants.ts` holding every slot for every split-out sub-component
recreates the same crowding this rule already fixes for components — once
`AccountMenu`/`SignInMenu` own their own render trees, each also owns a
co-located `account-menu-variants.ts` / `sign-in-menu-variants.ts` in its own
folder for the slots _only it_ uses. A slot genuinely used by **two or more**
sub-components (here, `panel` and `label` — both menus render the popover
surface and its title) stays in the shared top-level `auth-menu-variants.ts`
instead of being duplicated into each — duplicating a shared slot risks the
two copies drifting apart on the next edit, exactly the "second repetition"
failure mode this document keeps coming back to. The dispatcher's own
single-consumer slots (e.g. `placeholderLabel`) stay in the top-level file
too — it's the dispatcher's own file, not a subfolder concern:

```
auth-menu/
  auth-menu.tsx
  auth-menu-variants.ts              # dispatcher's own slots + genuinely shared ones (panel, window)
  components/
    account-menu/
      account-menu.tsx
      account-menu-variants.ts       # avatarTrigger, acctRow, accountName, accountEmail, signOutItem
    sign-in-menu/
      sign-in-menu.tsx
      sign-in-menu-variants.ts       # signInTrigger, cmdLine, cmdPrompt, providerButton, hint, …
```

A component consuming both its own slots and a shared one calls both `tv()`
functions (`const { avatarTrigger, ... } = accountMenuVariants(); const
{ panel, window } = authMenuVariants();`) — this is a small amount of extra
call-site surface in exchange for each variants file only describing the one
component's own styling contract, which is the same trade this rule already
makes for the components themselves.

## Rule 4 — reach for a `@blog/ui` atom before a raw HTML element

If `@blog/ui` already ships an atom for the element you're about to write —
`Button`, `TextInput`, `IconButton`, `Avatar` — use it, even for something as
small as a disabled loading placeholder. A raw `<button>`/`<input>` in
`apps/web` should be the exception (a framework-coupled wrapper genuinely
needs bare markup — `SmartLink`, `SanityImage`), not something reached for by
default because it's faster to type. `Button` already forwards every native
`ButtonHTMLAttributes` prop (`disabled`, `aria-hidden`, …) via `{...rest}`, so
there is rarely a real capability gap forcing a hand-rolled element — check
the atom's actual prop type before assuming it can't do what you need.

```tsx
// ❌ hand-rolled — no reason not to use Button, which forwards disabled/aria-hidden fine
<button type="button" disabled aria-hidden="true" className={signInTrigger()}>
  <span className={placeholderLabel()}>{t('signIn')}</span>
</button>

// ✅ reuses the design system, one class-merge to verify instead of a parallel implementation
<Button disabled aria-hidden="true" className={signInTrigger()}>
  <span className={placeholderLabel()}>{t('signIn')}</span>
</Button>
```

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
