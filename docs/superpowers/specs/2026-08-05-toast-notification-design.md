# Feedback Toast / Notification System — UI/UX Design

**Status:** Design / brainstorm pass (no code in this issue). Output feeds a
per-layer implementation plan (`superpowers:writing-plans`) once reviewed.
**Date:** 2026-08-05
**Related / dependencies:**

- **[`docs/design-reference/toast-notification-mock.html`](../../design-reference/toast-notification-mock.html)**
  — the pixel-precise, self-contained visual reference (open it in a browser;
  it uses this repo's real `theme.css` tokens and includes a live trigger
  panel for every variant). **This document specifies interaction, state,
  timing, and composition; the mock specifies exact visual treatment.** Every
  implementing agent must open the mock, not just read this doc.
- **[`2026-08-03-engagement-ui-design.md`](./2026-08-03-engagement-ui-design.md)**
  — the sibling design that introduces the actions this toast confirms
  (bookmark #1043, rating #1041, comments #1040, newsletter #1044, auth
  #1039). The toast is the shared feedback surface those five features emit
  into. It reuses that doc's "Terminal window chrome" foundation.
- **[`docs/design-reference/engagement-ui-mock.html`](../../design-reference/engagement-ui-mock.html)**
  — source of the window-chrome idiom (`.win`, `.win__bar`, prompt glyphs,
  `ease-console`) the toast is a compact instance of.

## Purpose of this pass

The engagement features each mutate user state (save a bookmark, submit a
rating, post a comment, subscribe). Every one of those actions needs
**transient, non-blocking confirmation** — and every one can also **fail** and
needs to say so. Today there is no shared surface for that. This document
specifies a single toast/notification system that:

- Supports a fixed set of **message types** — `success`, `info`, `warning`,
  `error`, and an async `loading` type that resolves into one of the others.
- Confirms **every engagement action** (full catalog below) in the site's
  console/terminal idiom rather than a generic Material snackbar.
- Defines the complete **interaction model** (enqueue, stack, cap, coalesce,
  pause, dismiss, undo), **animation spec** (enter/exit/reflow/timer, exact
  tokens), **placement/responsive** behaviour, and **accessibility** contract.
- Draws the **component boundaries**: a pure, prop-driven `@blog/ui`
  presentational layer and an `apps/web` client island that owns the queue and
  exposes an imperative `useToast()` API.

It deliberately contains **no implementation code**. Its output is a shared
mental model precise enough to ticket as an epic + per-layer sub-issues.

## Constraints that shape the design (not decoration)

These are load-bearing — they change what the components can be.

1. **`@blog/ui` stays pure.** The visual pieces (`Toast`, `ToastViewport`) are
   prop-driven and callback-based, own **no** client state, ship no
   `'use client'`. The queue, timers, and imperative API live in an `apps/web`
   client island (`ToastProvider` + `useToast`). Same split as
   `ThemeToggle`/`ThemeToggleButton` and every engagement component.
2. **Console/terminal idiom, tokens only.** A toast is a compact terminal
   window: a title bar echoing the command (`bookmark · saved`), a body line
   led by a colored prompt glyph (`›`/`✓`/`●`/`✕`), an optional action, and a
   draining timer line. Every colour/space/radius/motion value is a live
   `configs/tailwind/theme.css` token (`--surface`, `--border`, `--ok`,
   `--warn`, `--danger`, `--accent`, `--duration-*`, `--ease-console`). No new
   hex values.
3. **Non-blocking, ephemeral, never load-bearing.** A toast confirms something
   that **already happened** (optimistic UI) or reports a failure. It is never
   the only path to information: it never traps focus, never blocks the page,
   and its content is always also reflected in the persistent UI (the bookmark
   button already shows `saved`; the toast is reinforcement, not the source of
   truth). Anything requiring a decision the user must not miss is a dialog,
   not a toast.
4. **Accessibility conventions already in force.** Accessible names arrive via
   **props**, never hardcoded. No timestamp formatting inside `ui` — `web`
   passes a pre-formatted relative string. The viewport is an ARIA live region;
   politeness is derived from message type (see §7).
5. **Respect `prefers-reduced-motion`.** Slide and drain animations are motion;
   under reduced-motion they degrade to opacity-only with no transform and no
   visual timer sweep — but auto-dismiss timing is unchanged.

---

## 1. Anatomy of a toast

A single compact terminal window, ~`23rem` wide on desktop, built from four
token-driven parts (all present in the mock):

```
┌─────────────────────────────────────────────┐  ← border-left 3px = type color (--tc)
│  ✓  bookmark · saved            just now  ✕  │  title bar (surface-2, echoes command)
├─────────────────────────────────────────────┤
│  › stashed to ~/bookmarks                    │  body (result line, prompt in --tc)
│  [ undo ⌘Z ]                                 │  optional action row
│▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂                          │  timer line (2px, --tc, drains L→R)
└─────────────────────────────────────────────┘
```

| Part              | Content                                                        | Tokens                                                                |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Accent edge**   | 3px left border, encodes type                                  | `--tc` = type color                                                   |
| **Title bar**     | `glyph` + `command · state` + relative time + `✕`              | `--surface-2` bg, `--border` divider, `--text-muted`, glyph in `--tc` |
| **Body**          | prompt glyph + result line; key noun (path/value) in `--tc`    | `--text`, prompt/highlight in `--tc`                                  |
| **Action** (opt.) | ghost button (`undo`, `retry`, `view`) + optional `⌘`-key hint | `--border-strong` → hover `--tc`                                      |
| **Timer line**    | 2px bar, `scaleX(1)→0` over the toast's life                   | `--tc`, `opacity .7`                                                  |

`--tc` ("toast color") is set per type via a class (`t-ok`, `t-info`, `t-warn`,
`t-danger`) and every colored element inherits it, so a type change is a single
variable swap.

---

## 2. Message types

Five types. Four are terminal (auto-dismissing); `loading` is transient and
**resolves into** one of the four.

| Type      | `--tc` token      | Glyph         | Politeness    | Default life                 | Default action         | When                                                                                                                                   |
| --------- | ----------------- | ------------- | ------------- | ---------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `success` | `--ok` (green)    | `✓`           | polite        | 3.6 s                        | context (`undo`)       | An action completed: bookmark saved, rating recorded, comment posted, subscribed, copied.                                              |
| `info`    | `--accent` (blue) | `›`           | polite        | 3.6 s                        | optional (`view`)      | Neutral acknowledgement with no success/failure valence: "link copied", "signed out", "draft restored".                                |
| `warning` | `--warn` (amber)  | `●`           | polite        | 5 s                          | optional               | Completed but conditional: comment posted **but** awaiting moderation; subscription needs email confirmation; offline, will retry.     |
| `error`   | `--danger` (red)  | `✕` / `!`     | **assertive** | **sticky** (no auto-dismiss) | `retry` (usually)      | An action failed: save failed, network error, rating rejected. Persists until dismissed or retried — a failure must not vanish unseen. |
| `loading` | `--accent` (blue) | spinner / `◐` | polite        | until settled                | none (not dismissible) | An async action in flight (>~400 ms): "saving…", "subscribing…". Auto-replaced by its resolved type.                                   |

Notes that follow from the table:

- **Error is sticky and assertive by default.** Success/info/warning
  auto-dismiss on a timer and announce politely. This is the one type where
  disappearing silently would be a bug. An error toast dismisses only via `✕`,
  its `retry` action succeeding, or `Esc`.
- **`warning` is "yes, but".** It is not a soft error — the action succeeded.
  It buys a longer read (5 s) because it carries a caveat the user should
  actually absorb (pending moderation, confirm-your-email).
- **`loading` is a promise toast.** `useToast.promise()` shows it immediately,
  then swaps it **in place** (no exit/enter) to `success` or `error` when the
  promise settles — the frame, position, and title bar animate their color
  from blue to green/red. If the promise resolves in <400 ms, the loading
  toast is never shown (avoid flicker); the resolved toast appears directly.

Type is the only required field of a toast payload; everything else
(`command`, `state`, `message`, `action`, `duration`) has a per-type default.

---

## 3. Action catalog — what fires a toast

Every engagement mutation and its exact toast. `command`/`state` render in the
title bar; `message` is the body result line (highlighted noun in `--tc`
marked `‹…›` here). This is the authoritative mapping the `apps/web` islands
emit against.

### Bookmarks (#1043)

| Trigger               | Type      | Title bar            | Body message                   | Action      |
| --------------------- | --------- | -------------------- | ------------------------------ | ----------- |
| Save succeeds         | `success` | `bookmark · saved`   | `› stashed to ‹~/bookmarks›`   | `undo ⌘Z`   |
| Remove succeeds       | `info`    | `bookmark · removed` | `› removed from ‹~/bookmarks›` | `undo ⌘Z`   |
| Save/remove fails     | `error`   | `bookmark · failed`  | `! couldn't save — ‹retry?›`   | `retry R`   |
| Save while logged out | `info`    | `bookmark · sign in` | `› sign in to save this post`  | `sign in ↵` |

### Ratings (#1041)

| Trigger          | Type      | Title bar         | Body message                 | Action          |
| ---------------- | --------- | ----------------- | ---------------------------- | --------------- |
| Rating submitted | `success` | `rate · recorded` | `› your rating saved — ‹4★›` | `change` (opt.) |
| Rating changed   | `info`    | `rate · updated`  | `› updated to ‹5★›`          | —               |
| Submit fails     | `error`   | `rate · failed`   | `! couldn't record rating`   | `retry R`       |

### Comments (#1040)

| Trigger                          | Type            | Title bar           | Body message                   | Action    |
| -------------------------------- | --------------- | ------------------- | ------------------------------ | --------- |
| Comment posted (auto-approved)   | `success`       | `comment · posted`  | `› added to the thread`        | `view ↵`  |
| Comment posted, **needs review** | `warning`       | `comment · queued`  | `● posted — ‹awaiting review›` | —         |
| Comment deleted                  | `danger`→`info` | `comment · removed` | `✕ comment deleted`            | `undo ⌘Z` |
| Post/delete fails                | `error`         | `comment · failed`  | `! couldn't post — ‹retry?›`   | `retry R` |
| Reply posted                     | `success`       | `reply · posted`    | `› reply added`                | `view ↵`  |

### Newsletter (#1044)

| Trigger                            | Type      | Title bar              | Body message                      | Action    |
| ---------------------------------- | --------- | ---------------------- | --------------------------------- | --------- |
| Subscribe accepted (double opt-in) | `warning` | `subscribe · pending`  | `● check your inbox to ‹confirm›` | —         |
| Already subscribed                 | `info`    | `subscribe · noop`     | `› you're already subscribed`     | —         |
| Invalid email                      | `error`   | `subscribe · rejected` | `! ‹that email looks off›`        | —         |
| Network fails                      | `error`   | `subscribe · failed`   | `! couldn't subscribe — ‹retry?›` | `retry R` |

### Auth (#1039)

| Trigger         | Type      | Title bar        | Body message                         | Action      |
| --------------- | --------- | ---------------- | ------------------------------------ | ----------- |
| Signed in       | `success` | `auth · welcome` | `› signed in as ‹@val›`              | —           |
| Signed out      | `info`    | `auth · bye`     | `› signed out`                       | —           |
| Session expired | `warning` | `auth · expired` | `● your session expired — ‹sign in›` | `sign in ↵` |
| Sign-in fails   | `error`   | `auth · failed`  | `! couldn't sign in — ‹retry?›`      | `retry R`   |

### Generic / utility

| Trigger          | Type      | Title bar       | Body message                           | Action |
| ---------------- | --------- | --------------- | -------------------------------------- | ------ |
| Copy link        | `info`    | `clip · copied` | `› link copied to ‹clipboard›`         | —      |
| Offline detected | `warning` | `net · offline` | `● you're offline — changes will sync` | —      |
| Back online      | `success` | `net · online`  | `› back online`                        | —      |

Copy is deliberately dry and lowercase (CDS/console voice): no "!", no
"Successfully", verb-state in the title bar, the noun the user cares about
highlighted in the body.

---

## 4. Interaction model

### 4.1 Enqueue & ordering

- Newest toast enters at the **bottom** of the stack (closest to the corner);
  older toasts push **up**. Reading order top→bottom is oldest→newest, which
  matches the live-region announcement order.
- **Visible cap = 4.** A 5th toast entering evicts the **oldest non-error**
  toast instantly (no exit animation — it's already stale). Error toasts are
  never auto-evicted; if all 4 slots are errors, the new toast queues and
  appears when a slot frees.
- No unbounded off-screen queue for transient toasts — if many fire at once
  (see coalescing), they merge rather than backlog.

### 4.2 Coalescing / dedupe

Rapid repeat of the **same action** must not spam the stack:

- **Toggle collapse:** save→remove→save on the same post replaces the existing
  bookmark toast in place and resets its timer, rather than stacking three.
  Keyed by `(feature, entityId)`.
- **Counter merge:** N identical toasts within a 1 s window collapse to one
  with a count chip — e.g. `clip · copied ×3`. (Applies to `info`/`success`;
  errors never merge — each failure is distinct and sticky.)

### 4.3 Pause / resume

- **Hover** anywhere on a toast, or **keyboard focus** entering it, pauses its
  auto-dismiss timer **and** freezes the drain bar (`animation-play-state:
paused`). Leaving/blurring resumes from the exact remaining time (JS-tracked,
  not restarted).
- Pausing one toast pauses only that toast, not the stack.

### 4.4 Dismiss

A toast leaves on the first of:

1. **Timeout** — the per-type life elapses (not for `error`/`loading`).
2. **`✕` button** — always present, always dismisses immediately.
3. **Action resolves** — tapping `undo`/`retry`/`view`/`sign in` runs the
   callback and dismisses (except `retry` on an error, which swaps the toast to
   `loading` and only dismisses on success).
4. **`Esc`** — dismisses the **most-recent focusable** toast; with focus inside
   a toast, dismisses that one.
5. **Swipe** (touch) — horizontal swipe toward the screen edge dismisses;
   partial swipe springs back.

### 4.5 Undo semantics

`undo` is offered on reversible mutations (bookmark save/remove, comment
delete). Contract:

- The action is **optimistic** — already applied before the toast shows. `undo`
  reverts it. The toast's life is the effective undo window (3.6 s, or longer
  while hovered).
- Firing `undo` emits a follow-up `info` toast (`› reverted`) only if the
  reversal itself is async and could fail; a synchronous local revert stays
  silent (the UI already flipped back).
- For **destructive** actions with no cheap client-side revert (hard delete),
  prefer an **undo-before-commit** pattern: the toast's life is a grace period;
  the delete is only sent to the server when the toast expires without `undo`.
  (Decision D-3.)

### 4.6 Async (promise) toasts

`toast.promise(p, { loading, success, error })`:

1. If `p` is still pending after 400 ms → show `loading` toast.
2. On resolve → swap **in place** to `success` (color animates blue→green,
   glyph swaps, timer starts).
3. On reject → swap in place to `error` (blue→red, becomes sticky+assertive,
   gains `retry`).
4. If `p` settles before 400 ms → skip loading, show the resolved toast
   directly.

---

## 5. Animation spec

All motion uses `--ease-console` (`cubic-bezier(0.2,0,0,1)`) and the
`--duration-*` tokens. Values below are the mock's; treat them as the spec.

| Moment                                   | Property                         | From → To                     | Duration                            | Easing         |
| ---------------------------------------- | -------------------------------- | ----------------------------- | ----------------------------------- | -------------- |
| **Enter**                                | `transform`                      | `translateX(120%)` → `0`      | `--duration-slow` (360 ms)          | `ease-console` |
|                                          | `opacity`                        | `0` → `1`                     | `--duration-base` (200 ms)          | `ease-console` |
| **Exit**                                 | `transform`                      | `0` → `translateX(120%)`      | `--duration-slow`                   | `ease-console` |
|                                          | `opacity`                        | `1` → `0`                     | `--duration-base`                   | `ease-console` |
| **Stack reflow** (a toast leaves/enters) | `transform`/`margin` of siblings | staggered shift into new slot | `--duration-base`                   | `ease-console` |
| **Timer drain**                          | `transform: scaleX`              | `1` → `0` (origin left)       | = toast life (3.6 s / 5 s / custom) | `linear`       |
| **Type swap** (promise settle)           | `--tc` color + glyph             | blue → green/red              | `--duration-base`                   | `ease-console` |
| **Enter stagger** (multi-fire)           | —                                | 180 ms between siblings       | —                                   | —              |

- **Timer is `linear`**, deliberately — a shell progress bar reads as constant
  rate, and `ease-console` on a countdown would misrepresent remaining time.
- Enter uses a **double `requestAnimationFrame`** before adding the `in` class
  so the browser paints the off-screen start state first (no first-frame jump).
- Exit listens for `transitionend` with a `setTimeout` fallback so a dropped
  transition event never leaks a zombie node.

### Reduced motion (`prefers-reduced-motion: reduce`)

- No `translateX` on enter/exit — toasts **fade** in/out only
  (`opacity`, `--duration-base`, `linear`).
- **No drain bar animation** (the sweeping 2px line is removed); auto-dismiss
  timing is unchanged — the toast still leaves on schedule, just without the
  visual countdown. (Optionally show a static "auto-dismiss in Ns" affordance —
  Decision D-4, deferred.)
- Stack reflow is instant.

---

## 6. Placement & responsive

| Breakpoint           | Position                                                | Width                      | Notes                                          |
| -------------------- | ------------------------------------------------------- | -------------------------- | ---------------------------------------------- |
| **Desktop** (≥720px) | fixed **bottom-right**, `clamp(.8rem,3vw,1.4rem)` inset | `min(23rem, 100vw−1.6rem)` | Stacks upward.                                 |
| **Mobile** (<720px)  | fixed **bottom**, full-width minus gutters              | `100vw − 1.6rem`           | Still stacks upward; swipe-to-dismiss enabled. |
| **Safe areas**       | add `env(safe-area-inset-bottom)` to the bottom inset   | —                          | Clears iOS home indicator / notch.             |

- The viewport is `position: fixed`, `z-index` above page chrome but below any
  modal/dialog. A dialog open means new toasts still enqueue but the viewport
  sits beneath the dialog scrim (a toast never overlaps a modal it might relate
  to).
- `pointer-events: none` on the viewport container, `pointer-events: auto` on
  each toast — clicks pass through the empty gutter to the page beneath.
- The stack never grows past the cap, so it can't run off the top of a short
  viewport; on very short screens the cap effectively self-limits.

---

## 7. Accessibility

- **Live region.** The viewport (or a paired visually-hidden mirror) is an ARIA
  live region. Politeness is **derived from type**: `success`/`info`/`warning`
  announce via `aria-live="polite"` (`role="status"`); `error` announces via
  `aria-live="assertive"` (`role="alert"`) so a failure interrupts. Each toast
  also carries `role="status"`/`role="alert"` to match.
- **Announcement text** is the plain-language message, not the decorative
  command echo: e.g. "bookmark saved. stashed to your bookmarks." — glyphs and
  `~/path` styling are visual only and are `aria-hidden`.
- **Focus is never stolen.** Toasts do not auto-focus (that would yank the user
  mid-task). They are reachable: a global shortcut (**`F6`** convention, or
  `Alt+T`) moves focus **into** the newest toast; from there `Tab` reaches the
  action and `✕`, `Esc` dismisses, and focus returns to where it was.
- **Keyboard.** `Esc` dismisses (§4.4). Action `⌘`-key hints (`⌘Z` undo, `R`
  retry, `↵` view/sign-in) are real, globally bound **only while the toast is
  live** and unbound on dismiss, so they never shadow page shortcuts
  permanently.
- **Every control has a real name** via prop: the `✕` gets an `ariaLabel`
  ("Dismiss notification"), the action button's label is its visible text.
- **Timer/pause is discoverable to AT:** hovering/focusing pauses, so a
  screen-reader/keyboard user has unlimited time to reach and act on a toast —
  the visual countdown never races assistive tech.
- **Contrast:** type colors are the `theme.css` semantic tokens already tuned
  for both modes; the highlighted-noun text sits on `--surface`, not on a
  filled color, so it clears AA in light and dark.

---

## 8. Component boundaries & API

Same pure-`ui` / stateful-`web` split as the rest of the engagement layer.

### `@blog/ui` — presentational (pure, no state, no `'use client'`)

- **`Toast`** — renders one toast from props; emits callbacks, owns nothing.

  ```
  type TToastType = (typeof TOAST_TYPE)[keyof typeof TOAST_TYPE];

  interface ToastProps {
    type: TToastType;                 // required — drives --tc, glyph, politeness
    command: string;                  // "bookmark"
    state: string;                    // "saved"
    message: ReactNode;               // body result line (highlight applied by web)
    time?: string;                    // pre-formatted relative string ("just now")
    action?: { label: string; onAct: () => void; keyHint?: string };
    dismissLabel: string;             // ariaLabel for ✕ (no hardcoded a11y strings)
    paused?: boolean;                 // drain bar play/pause (controlled)
    durationMs?: number;              // sets --life; undefined => sticky (error)
    onDismiss: () => void;
    phase: 'entering' | 'visible' | 'leaving';  // drives in/out classes
  }
  ```

- **`ToastViewport`** — the fixed, ARIA-live container that lays out and stacks
  its `Toast` children. Prop-driven order/politeness; no timers.

### `apps/web` — the client island (owns all state)

- **`ToastProvider`** — a client component mounted once near the app root.
  Owns the queue (array of toast records), per-toast timers, pause/resume,
  coalescing, the cap/eviction policy, and phase transitions. Renders
  `ToastViewport` + `Toast`, feeding them props.
- **`useToast()`** — imperative API consumed by the engagement islands:

  ```
  const toast = useToast();
  toast.success({ command, state, message, action });
  toast.info(...); toast.warning(...); toast.error(...);
  toast.promise(promise, { loading, success, error });
  toast.dismiss(id?);            // id omitted => dismiss newest
  ```

  Each call returns an `id` for later `dismiss`/update. The engagement islands
  (BookmarkButton, RatingInput, CommentForm, NewsletterForm, auth) call these;
  they never touch the viewport directly.

- **Constants** live in `@blog/config` per repo convention (key === UPPERCASE
  value, `as const`):

  ```
  export const TOAST_TYPE = {
    SUCCESS: 'SUCCESS', INFO: 'INFO', WARNING: 'WARNING',
    ERROR: 'ERROR', LOADING: 'LOADING',
  } as const;
  ```

### State machine (per toast, owned by `ToastProvider`)

```
enqueued → entering → visible ⇄ paused → leaving → removed
                          │                  ▲
                          └── timeout/✕/Esc/action/swipe ──┘
loading: enqueued → entering → visible(loading) → (settle) → visible(success|error) → …
```

`error` and `loading` have no `timeout` edge out of `visible`.

---

## 9. Timing & policy summary (one table)

| Policy                                      | Value                                       |
| ------------------------------------------- | ------------------------------------------- |
| Default life — success/info                 | 3.6 s                                       |
| Default life — warning                      | 5 s                                         |
| Default life — error / loading              | sticky (no auto-dismiss)                    |
| Loading→settle grace before showing loading | 400 ms                                      |
| Visible cap                                 | 4                                           |
| Eviction                                    | oldest **non-error** dropped instantly      |
| Coalesce window (counter merge)             | 1 s                                         |
| Toggle-collapse key                         | `(feature, entityId)`                       |
| Multi-fire enter stagger                    | 180 ms                                      |
| Pause trigger                               | hover or focus-within                       |
| Enter                                       | slideX 360 ms + fade 200 ms, `ease-console` |
| Exit                                        | slideX 360 ms + fade 200 ms, `ease-console` |
| Timer bar easing                            | `linear`                                    |

---

## 10. Edge cases

- **Offline / flaky network:** the emitting action stays optimistic; if the
  server write later fails, emit a follow-up `error` toast referencing the same
  entity (not a silent rollback). Bookmark/rating buttons visually revert in
  concert.
- **Rapid navigation:** toasts are app-level (in `ToastProvider` above the
  router), so a confirmation survives a client-side route change and isn't tied
  to the page that fired it.
- **Duplicate promise:** a second `toast.promise` for the same key while one is
  pending replaces (does not stack) the loading toast.
- **Very short viewport:** cap + upward stacking keep the newest visible; older
  ones evict rather than scroll off the top.
- **SSR:** the provider renders nothing on the server; no toast is ever part of
  the static HTML (it's purely a client concern, consistent with the "article
  stays statically generated" constraint).
- **Reduced-motion + sticky error:** no drain bar, no auto-dismiss — the `✕`
  and `retry` are the only exits, which is correct (error was already sticky).

---

## 11. Decision log

- **D-1 — One system, five callers.** A single `ToastProvider`/`useToast`
  serves all engagement features rather than per-feature inline banners. Keeps
  voice, motion, and stacking consistent and avoids two toasts fighting for the
  same corner.
- **D-2 — Errors are sticky + assertive; everything else is timed + polite.**
  Rationale in §2. A failed save that auto-vanishes is the failure mode this
  choice exists to prevent.
- **D-3 — Undo-before-commit for hard deletes.** Where a server-side revert is
  expensive or impossible, the toast's life is the commit grace period; the
  destructive write only fires if the toast expires un-undone.
- **D-4 — Reduced-motion static countdown is deferred.** Under reduced-motion
  we drop the drain bar entirely for now; a static "dismisses in Ns" text
  affordance is a possible later addition, not v1.
- **D-5 — Bottom-right, stack upward.** Matches the console/terminal "log tail"
  mental model (newest line at the bottom) and stays clear of the top-of-page
  reading area and the sticky header.
- **D-6 — Coalesce, don't queue.** Transient toasts merge/replace rather than
  backing up an off-screen queue; only the cap + eviction bound the stack.

## 12. Non-goals (recorded for the eventual builds)

- **Notification center / history.** No persistent list of past toasts; they're
  ephemeral. (A `/notifications` inbox, if ever wanted, is a separate feature.)
- **Cross-device / push notifications.** Out of scope — this is in-page only.
- **Rich media toasts** (images, progress percentages beyond the timer bar).
- **User-configurable position/duration.** Fixed by design for consistency.
- **Stacking more than the cap** or a "show N more" expander.

## 13. How this should be ticketed (recommendation)

An epic (`feat: feedback toast system`) with per-layer sub-issues, dependency
order `config → ui → web`:

1. **config** — `TOAST_TYPE` constant + any shared duration tokens surfaced
   from `theme.css`.
2. **ui** — pure `Toast` + `ToastViewport` (+ Storybook stories covering all
   five types, action/no-action, paused, reduced-motion), prop-driven only.
3. **web** — `ToastProvider` + `useToast` island (queue, timers, coalescing,
   cap, promise API), mounted at app root; wire the five engagement islands to
   emit per the §3 catalog.

The `ui` PR can merge green on its own (additive, unused until wired); the
`web` PR is the completing one (`Closes #<epic>`). No `db` layer is involved —
toasts are pure client state.
