# Engagement Layer — UI/UX Design

**Status:** Design / brainstorm pass (no code in this issue). Output feeds a
per-issue implementation plan (`superpowers:writing-plans`) once reviewed.
**Date:** 2026-08-03
**Issues designed:** #1039 (auth), #1040 (comments), #1041 (ratings),
#1043 (bookmarks), #1044 (newsletter).
**Related / dependencies:**

- **`packages/db` (Neon + Drizzle)** — the non-Sanity persistence layer that
  backs every feature here. Tracked in **#984**, still open, not yet
  scaffolded. **Hard prerequisite** for all five. Data shapes (comments,
  ratings, subscribers, bookmarks, Auth.js adapter tables) were designed in
  the archived Phase 5/6 roadmap (`docs/archive/ROADMAP.md` §"Phase 5 —
  Engagement", §"Phase 6", Appendix A) and are treated here as fixed inputs.
- **`2026-07-31-semantic-search-design.md`** — the sibling design doc that
  established the "one Neon Postgres via `packages/db`, same contract as
  `service`" strategy this feature set assumes. Auth sessions, comments,
  ratings, subscribers, and bookmarks all land in that same database.
- **Auth (#1039) gates every write** in #1040/#1041/#1043. It is the root of
  the dependency graph within this set and should ship first.

## Purpose of this pass

Five engagement issues were filed with acceptance criteria that describe **data
shape, not UI** — each explicitly says it needs a design/brainstorm pass before
implementation. This document is that pass. It resolves, for each feature:
placement and composition on the page, interaction shape, the full set of
states, responsive/theme behaviour, and the concrete `@blog/ui` component
boundaries with prop sketches. It also resolves the cross-cutting questions the
issues left open (bookmarks-vs-likes, thread depth, moderation home, newsletter
placement) as **logged decisions**, and specifies how the five features compose
on a single article page without competing for attention.

It deliberately contains **no implementation code**. Its output is a shared
mental model precise enough that the follow-up planning step can ticket each
feature as an epic + per-layer sub-issues.

## Constraints that shape the design (not decoration)

These are load-bearing — they change what the components can be, not just how
they look.

1. **`@blog/ui` stays pure.** Every component is prop-driven and
   callback-based (`value`/`onChange`, `on*` handlers), owns **no** client
   state, and never ships `'use client'`. All state — Auth.js session, comment
   list, rating value, bookmark toggle, newsletter form status — lives in an
   `apps/web` client island that composes the pure component and feeds it
   `value`/`on*` props. This is the established `ThemeToggle` /
   `ThemeToggleButton` and `SegmentedControl` / `DepthToggle` pattern; every
   feature here follows it.
2. **Accessibility conventions already in force.** No hardcoded `aria-label`s —
   the accessible name arrives via a required `ariaLabel` **prop** (see
   `IconButton`, `SegmentedControl`, `CommandLink`). No date formatting inside
   `ui` — `web` passes a **pre-formatted** string (see `PostMeta`). Section and
   card titles are **real heading tags** (`<h2 id={titleId}>`, per
   `PostsSection`). Links use the polymorphic **`linkAs` / `as`** prop typed
   `TAnchorElementType`, never a bare `<a>`.
3. **The article stays statically generated.** `/blog/[slug]` renders
   statically; every engagement piece (login state, comments, rating input,
   bookmark toggle, the compact newsletter strip) is a **dynamic island**
   hydrated on top of the static article, lazy where possible so the article's
   LCP is untouched.
4. **Extend the existing visual language, don't compete with it.** The site has
   a distinct **console/terminal aesthetic** — `font-mono` prompts (`$`, `>`)
   in `--accent`, decorative glyphs marked `aria-hidden`, the CSS-only `blink`
   cursor, `ease-console` transitions (`terminal-chip`, `command-link`,
   `terminal-typing`). New engagement components adopt this idiom rather than
   introducing generic Material-style widgets. All colour/spacing/radius/motion
   comes from `configs/tailwind/theme.css` tokens (`--surface`, `--border`,
   `--accent`, `--text-muted`, `--spacing-section`, `rounded-sm`,
   `duration-base ease-console`) — no hardcoded values. Styling uses the `tv`
   wrapper from `@blog/ui/lib/styling`, never `tailwind-variants` directly.

## Cross-cutting foundations (build once, used by many)

Three things aren't owned by any single feature but are prerequisites for
several, and are easy to miss if each issue is read in isolation.

### Form-input primitives (new — shared by #1040 and #1044)

`@blog/ui` currently has **no text-input primitives** — there is no `Input` or
`Textarea` atom anywhere in the library (the atom set is avatar…theme-toggle,
none of them a field). Both the comment form and the newsletter form need one.
Rather than each feature inventing its own, the design introduces two pure,
controlled atoms up front, and both `CommentForm` and `NewsletterSignup` build
on them:

```ts
// atoms/text-input/text-input.tsx
export interface ITextInputProps
  extends
    Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'>,
    IWithDataTestId {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string; // required accessible name (or wired to a visible <label> id)
  invalid?: boolean; // drives error styling via a `variants: { invalid }`
  className?: string;
}

// atoms/textarea/textarea.tsx  — same surface over <textarea>, plus:
//   rows?: number;  maxLength?: number;   (length cap surfaced by the caller)
```

Both expose a `tv` variants file with an `invalid` variant switching
`border-border` → an error border token, and reuse the global `:focus-visible`
ring (`--ring: var(--accent)`). Terminal flourish is optional (a leading `$`
prompt slot) and consistent with `command-link`.

> **Decision D0 (foundational):** introduce shared `TextInput` + `Textarea`
> atoms as the first UI work in this set. Rationale: two features need them;
> divergent one-off inputs would fragment the form styling and a11y. Tradeoff:
> slightly more up-front scope before either feature's visible payoff.

### New icon assets

The icon set (`packages/ui/src/assets/icons/`) has `github`, `share`, `copy`,
etc., but is **missing**: a **`google`** glyph (auth provider button) and a
**`bookmark`** glyph (bookmark toggle, filled + outline states). These are small
`@blog/ui` asset additions and are called out per-feature below.

### Client-island + route inventory

New `apps/web` client islands (each owns state, composes a pure component):
`AuthMenu`, `CommentThread`, `RatingBlock`, `BookmarkButton`,
`NewsletterForm`. New routes: **`/bookmarks`** (auth-gated, saved-post grid) and
**`/admin/comments`** (role-gated moderation queue). Both compose existing pure
organisms (`PostsSection`/`PostCard`, `CommentItem`) — no new page primitives.

---

## Feature 1 — User auth / login (#1039)

**Decision (accepted): header popover.** Sign-in surfaces as a `PopoverMenu`
from a header button, not a dedicated `/login` route and not a modal — it
reuses an existing molecule, changes no route, and keeps the reader on the
article (no engagement-context loss). A modal was rejected because `@blog/ui`
has no dialog primitive and two provider buttons don't justify building a
focus-trapped one.

**Placement & composition.** The control lives in the Header's **trailing
actions cluster**, beside `ThemeToggleButton`, via `SiteNavigation`'s existing
`actions` prop into `PrimaryNavigation` (`actions={<><ThemeToggleButton /><AuthMenu /></>}`).
No new Header slot. Notably, auth needs **little or no new `@blog/ui`
component** — it composes existing pure pieces:

- _Logged-out:_ a `Button` ("Sign in") triggers a `PopoverMenu` with two items —
  "Continue with GitHub" and "Continue with Google" (`Icon` + label), each
  item's `onSelect` calling Auth.js `signIn(provider)`, which redirects to the
  provider and back to the **same article**.
- _Logged-in:_ the existing `Avatar` atom is the trigger; `PopoverMenu` shows a
  name/email header, **"My bookmarks"** (→ `/bookmarks`, Feature 4), and "Sign
  out" (`signOut()`).

The only pure-UI addition is the **`google` icon asset**. Everything stateful
(`useSession`, `signIn`, `signOut`) is the `AuthMenu` island in `apps/web`.

**States.** _Loading_ (session resolving) → a neutral placeholder mirroring
`ThemeToggle`'s `mounted=false` pattern, so there's no logged-out→logged-in
flash. _Error_ (OAuth failure returns `?error=`) → a small inline notice near
the sign-in button. _Logged-out_ / _logged-in_ as above.

**Responsive / theme.** On mobile the control collapses into the existing
`PrimaryNavigation` mobile region rather than adding a second toggle row. The
popover inherits `PopoverMenu` theming (`--surface`, `--border`), accent on
interactive items.

**Component surface.** No new pure component required beyond the icon; if a
thin convenience wrapper is wanted, it is a `web` island, not a `ui` atom.

---

## Feature 2 — Threaded comments (#1040)

**Decisions (accepted): one reply level; delete-only.** Threads are top-level
comments + **one** tier of replies; deeper replies stay in that tier with an
`@author` reference (GitHub-style). The DB's nullable `parentId` still records
true parentage; the UI just caps _visual_ nesting so mobile stays readable and
there's no collapse-state machine to build. Authors can **delete** their own
comment (soft-delete → a "comment removed" tombstone that preserves thread
shape); **edit is out of v1** (avoids an edit → re-moderation question).

**Placement & order.** A `CommentsSection` client island mounts on
`/blog/[slug]` **after `Article.Footer` (tags), before the "Related reading"
`PostsSection`** — article → discussion → exit ramp. It mirrors `PostsSection`:
a real `<h2 id={titleId}>` ("Comments · N"), `aria-labelledby`, empty-state
handling. Only this section hydrates; the article stays static.

**Interaction & moderation visibility.** New comments default to `pending` and
are invisible to the public until `approved`. The author, however, sees their
**own** just-posted comment immediately — the island optimistically renders it
with a de-emphasised **"Pending review"** badge; the server never returns other
users' pending rows, so the public list simply excludes them. Reply uses the
same `CommentForm` inline beneath a comment.

**States.** _Logged-out_ → the form area is replaced by a "Sign in to join the
discussion" prompt reusing the Feature-1 popover. _Empty_ → "No comments yet —
start the conversation." _Loading_ → skeleton rows. _Pending_ → author-only
badge as above. _Error_ → inline on the form, submit stays enabled to retry.

**Responsive / theme.** Reply nesting shown with `border-l border-border` + a
left offset that **collapses to one step on mobile**. Surfaces `--surface` /
`--surface-2`; the pending badge uses `--accent-muted`. Dates arrive
**pre-formatted** from `web`.

**Component surface (`@blog/ui`, pure):**

```ts
// organisms/comments-section — labeled section wrapper (mirrors PostsSection)
export interface ICommentsSectionProps extends IWithDataTestId {
  title: string; // e.g. "Comments"
  titleId: string; // for aria-labelledby + <h2 id>
  count: number;
  children: ReactNode; // the CommentList, or empty/prompt slot
  emptyMessage?: string;
  className?: string;
}

// molecules/comment-list — pure render over the passed tree, no fetching
export interface ICommentListProps extends IWithDataTestId {
  comments: ICommentView[]; // { id, authorName, avatarUrl?, formattedDate,
  //   body, status, isOwn, replies?: ICommentView[] }
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  replyingToId?: string; // which item shows the inline reply form
  renderReplyForm?: (id: string) => ReactNode; // web injects a CommentForm island slot
  labels: { pending: string; deleted: string; reply: string; delete: string };
  linkAs?: TAnchorElementType; // author name → profile/github link
}

// molecules/comment-item — one row (used by CommentList AND the /admin queue)
export interface ICommentItemProps extends IWithDataTestId {
  comment: ICommentView;
  formattedDate: string; // pre-formatted by web
  onReply?: (id: string) => void;
  onDelete?: (id: string) => void;
  actions?: ReactNode; // moderation-actions slot (approve/spam) for /admin reuse
  labels: { pending: string; deleted: string; reply: string; delete: string };
  linkAs?: TAnchorElementType;
}

// molecules/comment-form — controlled, built on the new Textarea atom
export interface ICommentFormProps extends IWithDataTestId {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
  maxLength: number; // visible counter; caller enforces
  ariaLabel: string;
  submitLabel: string;
  placeholder?: string;
}
```

`CommentItem` is deliberately shared between the public thread and the
moderation queue (via its `actions` slot), so both render identically.

---

## Feature 3 — Post ratings (#1041)

**Decisions (accepted): 5 stars, in the console idiom; end-of-article.**
Everyone sees the aggregate (avg + count); logged-in users get an interactive
1–5 input. The composite-unique `(userId, postId)` makes a vote an **upsert**,
so a user can change their rating but never add a second. The visual form is
five stars — but rendered as a **terminal gauge, not a generic UI star row**:
monospace glyphs in square brackets (`[★★★★☆]`) with an explicit `4.6/5`
numeral and count, `font-mono`, filled = `--accent`, empty = `--text-subtle`,
glyphs `aria-hidden` with the real name on `ariaLabel` — consistent with
`terminal-chip` / `command-link`. Discrete glyphs sidestep fractional-glyph
rendering; the numeral carries the precision. The block sits **at the end of
the article, just above comments** (you rate after reading), as one compact row.

**Interaction.** The `web` island (`RatingBlock`) owns the fetched summary +
session and does an **optimistic update**: on vote the user's glyphs lock to
their pick and the aggregate recomputes immediately from the write's returned
summary (aggregate cached by tag + `revalidateTag`, per the roadmap). Hover
fills the glyphs left-to-right like a console meter; keyboard arrows adjust with
a roving `tabIndex`, reusing `SegmentedControl`'s a11y model.

**States.** _Logged-out_ → `RatingSummary` only + a subtle "Sign in to rate"
link (Feature-1 popover). _Logged-in, not yet rated_ → empty `RatingInput` +
summary. _Logged-in, already rated_ → input filled to their value with a "Your
rating" label; re-clicking changes it. _Empty (no ratings)_ → summary shows
empty glyphs + "No ratings yet — be the first." _Loading_ → skeleton. _Error_ →
inline retry; optimistic value rolls back on failure.

**Responsive / theme.** Filled `--accent`, empty `--border`/`--text-subtle`;
touch targets ≥44px on mobile; the whole block stays one row.

**Component surface (`@blog/ui`, pure) — split display vs input:**

```ts
// atoms/rating-summary — read-only aggregate, terminal-gauge glyphs
export interface IRatingSummaryProps extends IWithDataTestId {
  average: number; // 0–5
  count: number;
  label: string; // pre-composed, e.g. "4.6/5 · 23 ratings"
  ariaLabel: string; // "Rated 4.6 out of 5 from 23 ratings"
  emptyMessage?: string; // shown when count === 0
  className?: string;
}

// atoms/rating-input — interactive discrete 1–5, hover + keyboard
export interface IRatingInputProps extends IWithDataTestId {
  value: number; // current user's rating, 0 = unrated
  onRate: (value: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
  ariaLabel: string; // "Rate this post"
  className?: string;
}
```

---

## Feature 4 — Bookmarks (#1043)

**Decision (accepted): bookmarks only** — not likes, not both. Ratings (#1041)
already provide the public appreciation signal, so _likes_ would duplicate it;
_bookmarks_ add distinct private "save-for-later" value and give the logged-in
user menu a real destination. Icon-only, no public count (bookmarks are
private).

**Placement & composition.** A `BookmarkToggle` sits in the **article header
meta strip, beside share** — saving is a decide-early action, so it belongs at
the top, not buried after comments. The logged-in state is a filled icon; the
logged-out state is hidden or renders a "Sign in to save" affordance. A new
**`/bookmarks`** page (auth-gated) lists the user's saved posts by **reusing the
existing `PostCard` grid / `PostsSection`** pattern — no new page primitive —
and is reached from the user-menu "My bookmarks" item (Feature 1).

**States.** _Logged-out_ → sign-in affordance (or hidden, per copy). _Not
bookmarked_ → outline icon. _Bookmarked_ → filled icon (optimistic on toggle).
_Loading_ → disabled/neutral. _Error_ → toggle rolls back + a transient inline
message. `/bookmarks` _empty_ → "No bookmarks yet — save a post to find it
here."

**Responsive / theme.** Icon target ≥44px on mobile; filled `--accent`, outline
`--text-subtle`. Uses `aria-pressed` for toggle state.

**Component surface (`@blog/ui`, pure):**

```ts
// atoms/bookmark-toggle
export interface IBookmarkToggleProps extends IWithDataTestId {
  isBookmarked: boolean;
  onToggle: () => void;
  ariaLabel: string; // "Save post" / "Remove bookmark" — resolved by web
  disabled?: boolean;
  className?: string;
}
```

Needs the new **`bookmark` icon asset** (filled + outline). The `/bookmarks`
grid reuses `PostsSection` + `PostCard` as-is.

---

## Feature 5 — Newsletter signup (#1044)

**Decisions (accepted): all three surfaces; double opt-in.** The signup appears
in the **site footer** (persistent), as a **CMS page-builder module** (authored
placement — the issue's original intent), **and** at the **end of every
article**. Confirmation is **double opt-in**: Resend sends a confirmation email;
the subscriber is active only after clicking. Success copy says "check your
inbox."

**One component, three densities.** To let the same component live in three
places without the article foot becoming a wall of CTAs (see Composition), it
carries a **`density`/`variant` prop**:

- **`full`** — the rich, tinted boxed signup, used in the **footer** and the
  **CMS page-builder module**.
- **`compact`** — a slim, single-row strip ("Get new posts by email:
  `[field] [subscribe]`") used at the **end of every article** (per the accepted
  decision to keep that instance low-weight). Styled in the console idiom
  (`$ subscribe` prompt) to match the site.

The CMS page-builder surface additionally needs a **Sanity module schema**
(`apps/cms`) and a renderer in the existing `content-module` organism — so this
feature spans `cms` + `ui` + `web`. The Resend call is a server action in the
`NewsletterForm` island.

**States.** _Idle_ → field + button. _Submitting_ → disabled + spinner.
_Success_ → "Almost there — check your inbox to confirm." _Error_ → inline:
invalid email (client-side format check before submit), already subscribed,
server error. The field builds on the new `TextInput` atom.

**Responsive / theme.** `compact` field+button stack vertically on narrow
screens; `full` box constrains to `max-w-copy`. Tokens throughout;
the `full` variant may use the `tinted` section treatment already in
`PostsSection`.

**Component surface (`@blog/ui`, pure):**

```ts
// organisms/newsletter-signup
export interface INewsletterSignupProps extends IWithDataTestId {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  status: 'idle' | 'submitting' | 'success' | 'error';
  variant?: 'full' | 'compact';
  heading?: string; // omitted/hidden in compact
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  className?: string;
}
```

---

## Comments moderation

**Decision (accepted): a role-gated `/admin/comments` queue in `apps/web` now,
designed to accept an automatic pre-filter later.** Comments live in **Neon
Postgres, not Sanity**, so the moderation home belongs in `web` where `db`
access already is — a Sanity Studio tool would need a custom plugin talking to
Postgres and would break the "cms = Sanity content only" boundary. The queue
lists `status = 'pending'` rows from `packages/db` and offers **approve /
mark-spam / delete** via server actions, **reusing the pure `CommentItem`** (its
`actions` slot) so the queue and the public thread render identically. The
`pending`-by-default schema makes this safe: nothing is public until approved.

**How the "automatic" phase works in practice (recorded for later, not v1).**
At `POST /api/comments`, before a row goes public, a classifier scores it and
chooses the `status`:

- **Perspective API** (0–1 per attribute: `TOXICITY`, `SEVERE_TOXICITY`,
  `INSULT`, `THREAT`) or **Akismet** (spam/ham).
- Two thresholds: below the low one → `approved` (posts instantly); above the
  high one → `spam` (hidden); **the uncertain middle → `pending`**, routed to
  the same `/admin` queue.

So mature "automatic" moderation is really _auto pre-filter + a small human
queue for the middle_ — exactly what the manual-first queue builds toward. Pure
automatic (approve/reject only, no queue) is rejected: a false positive
silently drops a legitimate comment and a false negative publishes something
toxic with no recourse. Reader experience: a clean comment posts instantly
(feels unmoderated); a toxic one is held as `pending`, shown only to its author
(spammers aren't tipped off). Cost is one API call per submit (~100–300 ms,
**write-path only**, off the reader hot path) with a timeout that **fails to
`pending`, never to `approved`**, if the classifier is down; adds one env key.
Designing the insert path to accommodate this now means the later switch needs
**no UI change**.

---

## How the five features compose

### Global (every page)

- **Header trailing actions:** `AuthMenu` (sign-in popover / avatar dropdown) +
  `ThemeToggle`, in that order, via the existing `actions` prop. The logged-in
  dropdown carries **"My bookmarks" → `/bookmarks`**.
- **Site footer:** gains the **`full` `NewsletterSignup`**.
- **New routes:** `/bookmarks` (auth-gated, `PostCard` grid) and
  `/admin/comments` (role-gated queue).

### Article page `/blog/[slug]` — top to bottom, with graded visual weight

The design principle is **one dominant block, everything else subordinate**, so
four engagement pieces at the foot don't all shout:

1. `Article.Header` meta strip → author · date · share · **`BookmarkToggle`**
   (save-early belongs at the top).
2. `Article.Body` (static) → `Article.Footer` (tags). _End of static content._
3. **Rating** — a quiet, compact single row ("Rate this post" + the
   terminal-gauge stars). Low emphasis (`--text-muted`), subordinate to
   comments.
4. **Comments** — the heavyweight, full `<h2>` section; the **only** block that
   gets real vertical space. This is the primary engagement surface.
5. **Newsletter (`compact`)** — a slim, rule-separated single-row strip. Its
   low weight (vs the footer/module `full` version) is the whole reason "at
   every article end" doesn't overload the foot.
6. **Related reading** — the existing tinted `PostsSection`, the exit ramp,
   last.
7. `BackToTopButton`.

Blocks are separated by `--spacing-section`; each engagement block is a labeled
`<section aria-labelledby>`; all are **lazy client islands** so the static
article's LCP is untouched. **Mobile:** everything full-width, comment reply
indent collapses to one step, the `compact` newsletter field+button stack,
rating stays one row. **Theme:** tokens only, inheriting dark/light and the
`.indigo` accent.

### Auth as the spine

Auth (#1039) gates comments (post/reply/delete), rating input, and bookmark
toggle. Each of those, when logged-out, degrades to the **same** "Sign in …"
affordance that reuses the Feature-1 popover — one login entry point, surfaced
contextually, rather than four different logged-out treatments.

---

## Consolidated `@blog/ui` component list

| Component                        | Kind     | New?    | Purity / a11y notes                                                           |
| -------------------------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `TextInput`                      | atom     | **new** | controlled `value`/`onChange`, required `ariaLabel`, `invalid` variant        |
| `Textarea`                       | atom     | **new** | as above + `rows`/`maxLength`                                                 |
| `RatingSummary`                  | atom     | **new** | read-only aggregate, mono glyphs `aria-hidden`, name via `ariaLabel`          |
| `RatingInput`                    | atom     | **new** | interactive 1–5, hover + roving-tabindex keyboard, `ariaLabel`                |
| `BookmarkToggle`                 | atom     | **new** | `isBookmarked`/`onToggle`, `aria-pressed`, `ariaLabel`; needs `bookmark` icon |
| `CommentItem`                    | molecule | **new** | pre-formatted date prop, `actions` slot (shared with `/admin`), `linkAs`      |
| `CommentList`                    | molecule | **new** | pure recursion (one visual level), reply-form slot injected by `web`          |
| `CommentForm`                    | molecule | **new** | controlled, built on `Textarea`, visible length counter, `ariaLabel`          |
| `NewsletterSignup`               | organism | **new** | `full`/`compact` variants, controlled, built on `TextInput`                   |
| `CommentsSection`                | organism | **new** | `<h2 id={titleId}>`, `aria-labelledby`, empty state (mirrors `PostsSection`)  |
| `Avatar`                         | atom     | reuse   | auth trigger                                                                  |
| `PopoverMenu`                    | molecule | reuse   | sign-in provider list + account menu                                          |
| `Button` / `IconButton` / `Icon` | atoms    | reuse   | sign-in button, actions; needs `google` icon                                  |
| `PostsSection` / `PostCard`      | organism | reuse   | `/bookmarks` grid, related reading                                            |

New assets: `google.svg`, `bookmark.svg` (filled + outline). New `apps/web`
islands: `AuthMenu`, `CommentThread`, `RatingBlock`, `BookmarkButton`,
`NewsletterForm`. New `apps/cms` schema: newsletter page-builder module.

## Decision log

| #   | Decision               | Chosen                                             | Rejected alternatives                    |
| --- | ---------------------- | -------------------------------------------------- | ---------------------------------------- |
| D0  | Form primitives        | Shared `TextInput` + `Textarea` atoms, built first | Per-feature one-off inputs               |
| D1  | Sign-in affordance     | Header `PopoverMenu`                               | Dedicated `/login` route; modal dialog   |
| D2  | Comment thread depth   | One reply level (`@author` beyond)                 | Full nesting + collapse; flat            |
| D3  | Comment edit/delete    | Delete only (soft-delete tombstone)                | Edit + delete; neither                   |
| D4  | Rating form            | 5 stars in console/terminal idiom                  | Numeric segmented; thumbs                |
| D5  | Rating placement       | End of article, above comments                     | Header meta; header + end                |
| D6  | #1043 scope            | **Bookmarks only**                                 | Likes only; both                         |
| D7  | Newsletter placement   | Footer + CMS module + end-of-article               | Fewer surfaces                           |
| D8  | Article-end newsletter | `compact` strip variant                            | `full` box; drop it                      |
| D9  | Newsletter opt-in      | Double opt-in                                      | Single opt-in                            |
| D10 | Moderation             | `/admin` queue now, auto pre-filter later          | Fully automatic only; Sanity Studio tool |

## Non-goals (recorded for the eventual builds)

- User **profiles / public author pages** beyond an avatar + name.
- Comment **reactions/voting**, rich-text/markdown bodies, or `@mentions`
  notifications — v1 comment bodies are plain text.
- Comment **edit** (D3), and any edit → re-moderation flow.
- **Likes** and any public appreciation count beyond the rating aggregate (D6).
- Building the **automatic** moderation classifier (recorded above; queue is v1).
- Newsletter **campaign composition / sending** UI — this design covers _signup_
  only; authoring/sending broadcasts is a separate concern.
- **Notifications** (email-on-reply, digest) for any feature.
- The `packages/db` schema/migrations themselves — owned by #984 and the
  per-feature db sub-issues; this doc consumes their shapes, doesn't design them.

## How this should be ticketed (recommendation)

Each feature spans multiple layers (`db` + `web` at minimum; most also `ui`;
newsletter also `cms`), so per this repo's "epic + one sub-issue per layer"
rule each of #1039–#1044 becomes an **epic with per-layer sub-issues**, gated in
this order:

1. **#984 `packages/db` bootstrap** — hard prerequisite for all five.
2. **D0 form primitives** (`ui`: `TextInput` + `Textarea`) and the two icon
   assets — small, unblock #1040 and #1044.
3. **#1039 auth** — the spine; gates the write paths of #1040/#1041/#1043.
4. **#1040 comments**, **#1041 ratings**, **#1043 bookmarks** — parallel once
   auth lands (each: `db` → `service`/route → `ui` → `web`).
5. **#1044 newsletter** — independent of auth; `cms` module + `ui` + `web`.
6. **Moderation `/admin/comments`** — a `web`-owned sub-issue of #1040.

No code changes in this issue — the next step is a `superpowers:writing-plans`
pass per epic, using the component surfaces and decisions above.
