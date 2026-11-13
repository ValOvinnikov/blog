---
title: Platform shell
status: built
layers: [platform, db, auth, config]
code:
  - apps/platform/src/app/**/layout.tsx
  - apps/platform/src/app/**/not-found.tsx
  - apps/platform/src/app/**/error.tsx
  - apps/platform/src/app/**/select-tenant/**
  - apps/platform/src/components/features/layout/**
  - apps/platform/src/server/layout/**
  - apps/platform/src/server/page-metadata/**
  - apps/platform/src/server/tenant-pages/**
  - apps/platform/src/server/auth/list-session-tenants*
  - apps/platform/src/server/auth/resolve-dashboard-tenant*
  - apps/platform/src/utils/nav-sections/**
  - apps/platform/src/utils/dashboard-nav-sections/**
  - apps/platform/src/utils/studio-nav-item/**
  - apps/platform/src/utils/persistent-cookie/**
  - apps/platform/src/utils/routes/**
  - apps/platform/src/utils/settle-action/**
  - apps/platform/src/utils/page-out-of-date/**
  - apps/platform/src/utils/reload-page/**
  - apps/platform/src/utils/active-tenant-cookie/**
  - apps/platform/src/utils/sidebar-collapsed-cookie/**
  - apps/platform/src/utils/theme-preference-cookie/**
  - apps/platform/src/utils/theme-preference/**
  - apps/platform/src/utils/use-theme-preference/**
  - apps/platform/src/constants/theme.ts
  - apps/platform/src/utils/tenant-switcher-items/**
  - apps/platform/src/context/unsaved-changes-provider/**
  - apps/platform/src/components/shared/guarded-link/**
  - apps/platform/src/components/shared/button/**
  - apps/platform/src/components/shared/menu-surface/**
  - apps/platform/src/components/shared/menu-radio-group/**
  - apps/platform/src/components/shared/breadcrumbs/**
  - apps/platform/src/i18n/**
  - apps/platform/src/proxy.ts
  - apps/platform/src/styles/platform-theme*
epics: [4979, 4980, 4840, 4959]
---

# Platform shell

## What it does

The chrome every signed-in page of `apps/platform` renders inside: a sidebar of
nav sections with the account menu at its foot, a topbar with a breadcrumb,
and a content column. It comes in three gated trees: the operator's Platform section, the
operator's view of one tenant, and the owner's `/dashboard`, which never shows
that the platform hosts more than one tenant. The 404, error and
`/dashboard/select-tenant` pages render before the shell: the 404 and error
pages in the branded `CenteredCardFrame`, the workspace picker on the
onboarding wizard's dark rail.

## Surfaces and routes

URLs carry no locale prefix (next-intl `localePrefix: 'never'`).

- **Operator Platform section**, the `(operator)` group: `/tenants`,
  `/tenants/new`, `/findings`. `/` redirects an admin to `/tenants`. The
  tenants table opens newest first; each column header sorts it and a second
  click reverses, and a search field narrows it by name or any of the
  tenant's domains, so a site on a custom domain is still found by its slug.
  The search applies 300ms after typing pauses, or at once on Enter, ignores
  surrounding spaces, keeps focus in the field while results update, and has
  its own clear button in place of the browser's native one. Each applied
  search is a fresh server query that replaces the history entry rather than
  adding one, and a late response for an older search never overwrites newer
  typing. Visibility, sort and search live in the URL
  (`?archived=1&sort=<column>&direction=<ascending|descending>&q=`), so a
  reload or shared link keeps them; `listTenants`' own default order stays by
  name, which the dashboard tenant picker relies on.
- **Operator tenant view**: `/tenants/{id}` and its Look, Voice, Features,
  Languages, Domain, Email, Studio, Provisioning and Danger zone pages. The
  sidebar shows the Platform section plus the tenant's own sections.
- **Owner dashboard**: `/dashboard` and its Look, Voice, Features,
  Languages, Domain, Email and Studio pages. `/dashboard/select-tenant` is a
  picker for a user with several workspaces: rows sorted by name, each with
  its domain and "role · plan" (role hidden for a SUPERADMIN's virtual
  membership), archived workspaces in their own read-only group, and a
  filter by name or domain that appears only when the list would scroll.
- **Owner Overview** (`/dashboard`) is one column, 16px apart below `md` and
  24px from `md`, in this order: the heading (tenant name, status pill, "Your
  site at a glance…" and Open site, with no plan pill; the operator Overview
  keeps its plan pill), the archived notice (archived tenants only), the site
  setup card (while setup is incomplete or failed), the Get started card (the
  real owner only, once setup is READY, until all four first-run steps are
  done; `platform-sign-in-and-onboarding.md` → "First run"), the Your site band, the
  Domain and Owner pair, then Make it yours. Your site is a full-width card
  whose header holds only the title; under it one row of four label-over-value
  cells (Name, Public domain, Plan, Language) in 3:3:2:2 widths, and below
  `md` two columns (Name and Public domain a full row each, Plan and Language
  sharing one). A footer strip carries the read-only hint. Domain and Owner sit
  in two equal columns from `md` and stack below; from `md` to below `lg`
  their detail lists stack label over value, following the window width.
- `GET /api/dashboard/select-tenant?tenantId=` sets the active-workspace
  cookie and redirects to `/dashboard`.
- Every other path 404s through a catch-all. `not-found.tsx` renders
  `DeadEndView` with a home link from `resolveHomeHref` (sign-in, `/tenants`
  for an admin, `/dashboard` otherwise); `error.tsx` offers only Retry.

Below `md` the sidebar is hidden and `TopbarNavMenu` carries the same sections.
The content column and the notices above it start at the sidebar's right
edge, never centred: at most 1180px wide, with 26px padding from `md` and
16px below, and any spare width on the right. The column adds no gap of its
own; spacing between page children is each page's. The Studio segment
switches the content column to full-bleed (see
[embedded-studio](./embedded-studio.md)).

Every settings page (Voice, Look, Email, Languages, Features) renders through
`SettingsFormShell`, whose save bar appears only while the page has unsaved
changes and never for an archived tenant. From `md` it docks to the viewport
bottom, from the sidebar's right edge (rail edge when collapsed) to the right
edge: 64px tall, flat, top border and `shadow-platform-dock`. It shows a dot,
"N unsaved changes", the "⌘S / Ctrl+S" hint (from `lg` only), Discard and Save
changes. With invalid fields the left side becomes "N fields need attention",
"Go to the first one" and "Not saved" — one line from `lg`, stacked on two
lines from `md` to `lg` — and the dot, count and hint go. While saving, Save
reads "Saving…" through the Button's pending state (focus stays on it),
Discard is disabled and the bar is `aria-busy`. A save that fails with no
field errors — a server error, offline, or a plan refusal — shows the page's
failure message in the bar's left side in place of the dot, count and hint, as
one `role="alert"`, and the changes stay unsaved; invalid fields keep that slot
until they are cleared. A retry withdraws it while it is in flight, so a second failure announces again, and the next edit or a successful save clears it. The bar grows past 64px to fit a long message, and while it shows, the page's bottom room and scroll padding follow its measured height (`--platform-save-bar-height` on `<html>`), with the 64px dock and 85px phone footer as scroll-padding fallbacks. When the
failure leaves nothing unsaved (a plan refusal that restored every refused
value), the message is an error toast instead, which stays until it is
dismissed or the next save starts; the toast viewport sits above the bar's
measured height. While a page hides the bar over remaining changes, the
message waits for the bar to return. Below its last content the page keeps the content column's own padding —
the side gutter, 26px from `md` and 16px below — plus the visible bar's
measured height, so the gap above the bar matches the sides and no extra room
is left while no bar shows (archived included). From `md` the document's
`scroll-padding-bottom` is the bar's 64px
plus 16px so a focused field never sits under the bar, and when the bar
first appears the focused control is scrolled into view (`block: 'nearest'`),
since the bar's new room grows the page without scrolling it. The 64 and 16 are the
`--spacing-platform-dock` / `-clearance` tokens, kept equal to
`LOOK_LAYOUT_LIMIT`. A page may opt out of the head's "All changes saved"
status (`hasSavedStatus={false}`); Voice does. Below `md` the bar spans the
viewport bottom edge to edge with Discard and Save.

A save outside `SettingsFormShell` — the tenant details panel and the Add
tenant form — submits from its card's footer and shows a failed save there, as
an error `Alert` (`role="alert"`) beside the Save button through
`Card.Footer`'s `error`, wrapping above the button when the footer is too
narrow for both. What the user entered stays. Saving again withdraws it while
the request is in flight, so a second failure announces again, and a
successful save clears it.

Voice opts into its own phone footer below `md` (`layout.hasPhoneSaveFooter`)
in place of that bar; from `md` it docks like every other page. The footer is
fixed to the viewport bottom, full width, flat with a top border, and stays
mounted when clean (never for an archived tenant). It is a region named by its
own status text — "N unsaved changes" with a dot, "All changes saved" with
Save disabled, "N fields need attention" on a first row above "Go to the
first one", or a failed save's message (an alert, while changes remain) — and has Save changes but no Discard and no shortcut hint. While
saving it is `aria-busy` and Save reads "Saving…" and keeps focus; it renders
outside Voice's `inert` content. Below `md` Voice's bottom room is the
16px gutter plus the footer's measured height, and its `scroll-padding-bottom`
is that height plus 16 (85px plus 16 before it is measured,
`--spacing-platform-phone-footer-max`, the two-row error footer); an archived
Voice page shows no footer, so it ends at the 16px gutter.

A successful save pressed from Save changes — in the docked bar or Voice's
phone footer — returns focus, without scrolling, to the control that had it
before Save was pressed, so the bar unmounting or the footer's Save disabling
never drops a keyboard user's place. If that control has left the page, focus
moves to the page's `h1` instead. A save from ⌘S / Ctrl+S never moves focus,
and a failed or refused save leaves it where it is (a refused save reveals and
focuses the first invalid field).

A message appears where the user is looking when it happens. An invalid
field shows under the field, plus the count in the save bar; a success is a
toast. A failed save shows in the save bar or beside its Save button (an error
toast once nothing is left unsaved), and a
failed one-off button action is an error toast or an error `Alert` right
beside the button. A failure inside a dialog stays in the dialog, which stays
open. A top-of-page `Alert` describes page state only (archived, plan limits,
draft recovery, warnings), never an action's result. So the custom-domain claim's connect
rejection sits directly above Remove and Verify, the site setup card's failed
retry directly below the notice holding its Try again or Start setup
button, the email sign-in refusal two rows above its send button, and
onboarding's failed Create site in the pinned footer above Back and Create
site, never at the top of the step.

A save from a page whose build is gone — the action no longer exists on the
server, so the tab was opened before a deploy and outlived Skew Protection —
shows none of those. Every save goes through `settleAction`, which opens one
app-wide alert dialog mounted in the locale layout: "This page is out of
date." / "Reload to continue." with a single Reload button. It has no
dismiss, and the page reloads only from that button; on a settings form with
unsaved changes the browser's leave-site prompt comes first, so the person can
still copy what they typed. The rejected save never settles, so the form keeps
its values and shows no error of its own beneath the dialog. Its pending
transition also holds every later navigation and refresh in the tab until the
reload, which Reload being the only way out makes harmless. Any other rejected
save still settles as the form's generic server error.

## Data

- Neon: `admins` (role), `memberships` and `tenants`, read through
  `@blog/db` queries; nothing is written except the cookies below.
- Cookies: `platform-active-tenant` (httpOnly, 30 days, set only by the
  select-tenant route), `platform-sidebar-collapsed` (client-written, one
  year; read server-side for the first render), `platform-theme` (the
  per-device theme preference, one year; read server-side for the first
  render) and the per-tenant `studio-entered-<tenantId>` (client-written,
  one year), which no surface reads any more (`embedded-studio.md`). The
  first three still read their earlier `admin-` name (`admin-active-tenant`,
  `admin-sidebar-collapsed`, `admin-theme`) when the new one is absent;
  the old names are never written.
- Request caching: `listSessionTenants`, `resolveDashboardTenant`,
  `requireAdmin` and `requireTenantById` are React `cache()`-wrapped, so a
  layout and its page share one lookup per request. Nothing is cached across
  requests.

## Configuration

- Nav items come from `nav-sections.ts`: `operatorNavSections`,
  `tenantNavSections` and `dashboardNavSections`. The operator's Platform
  section lists Tenants and Findings, plus Releases, Blocked sign-ups and Data
  requests for a SUPERADMIN. Add tenant is the Tenants page's primary action,
  not a row; its breadcrumb leaf on `/tenants/new` is named explicitly.
- The current row is decided once, by `isCurrentNavHref`, for the sidebar, the
  rail and the phone Menu alike: the row whose href is the pathname, Tenants on
  `/tenants/new` (an explicit match, not a prefix rule), and a Studio row on
  every path under its own, so it stays current while the embedded Studio
  navigates.
- On `/dashboard`, the plan decides which items appear (`planPageAccess`, see
  [plans-and-entitlements](./plans-and-entitlements.md)): Languages needs more
  than one plan locale, Email a mail-sending capability, and the inert "Coming
  soon" rows Subscribers NEWSLETTER and Team `GROWTH` only. There is no
  Comments entry.
  Their "Coming soon" pill is `neutral` with no dot, at the row's right edge,
  in the sidebar and the phone Menu alike; Leads' unread count is a `brand`
  pill with no dot.
  The operator's tenant view (`EVERY_PLAN_PAGE`) always shows every page.
- UI copy is next-intl, five message files (`en`, `de`, `es`, `fr`, `nl`). It
  is fixed platform copy and never [Voice](./voice.md).

## Constraints and invariants

- Every gate lives in a layout, so no page can forget it: `(operator)` calls
  `requireAdmin`, `/tenants/{id}` calls `requireTenantById` (any admin role),
  `/dashboard` calls `listSessionTenants` and then `resolveDashboardTenant`.
  A layout gate does not cover Route Handlers or Server Actions; each of
  those calls its own gate (see [tenant-access](./tenant-access.md)).
- A denied entitlement 404s, indistinguishable from a missing route. No
  session redirects to sign-in.
- `/dashboard` with zero memberships redirects to `/onboarding`. Only a
  SUPERADMIN gets every tenant, as virtual OWNER memberships; an ADMIN or
  MODERATOR with no membership is sent to `/onboarding` too.
- With one membership the tenant is implicit. With several, a valid
  `platform-active-tenant` cookie picks it, otherwise the picker opens. The
  select-tenant route re-checks membership (or SUPERADMIN) before setting the
  cookie, and every link to it passes `prefetch={false}`.
- The account's role line never shows a virtual membership's OWNER role; it
  shows the admin role behind it.
- Plan-gated dashboard pages go through `renderTenantScopedPage`, which 404s
  when the plan lacks the page. It is called as a function, never as JSX.
- The tenant layouts render the sidebar once and keep it across client
  navigation, so a badge or line that can change while the owner stays in
  `/dashboard` must refresh the route itself. The Studio access line does: the
  Studio page compares its fresh access state with the one the sidebar was
  rendered with (`ShellStudioAccessProvider`) and refreshes when they differ,
  and the home page's site-setup card refreshes once the run it polls
  settles, which is when the owner invite is recorded. **Check now** already
  refreshes. A virtual membership has no badge on either side.
- `adminRoutes` is the only place platform URLs are built.
- The shell's `Link` is `GuardedLink`, which asks before leaving a page with
  unsaved changes.
- The platform's language is next-intl's: the `NEXT_LOCALE` cookie first, then
  the browser's language, falling back to English.
- The platform's colours are `--platform-*` tokens in `styles/platform-theme.css`,
  each with a `--color-platform-*` Tailwind colour; shadows read `--platform-shadow`
  and `--platform-shadow-menu`. The light sidebar is grey (`side` #eef0f3 with
  `side-line` rules); its text is `side-text` and
  `side-muted`, and no sidebar text is drawn in `faint`, which is for icons
  and chevrons only. A nav row rests in `side-text` with a `side-muted`
  icon (a colour, never an opacity) and hovers to a `side-line` ground; the
  current page's row is a `side-raised` plate with the raised shadow, its
  text and icon `brand-ink` at 600, and a 3px `side-accent` bar on its left
  edge, on the collapsed rail too. A focused row keeps its rest colours and
  shows the side-gapped `side-accent` ring, which replaces the plate's shadow.
  An inert row (no destination) keeps the rest colours with no hover ground,
  is exposed as a disabled link (`role="link"`, `aria-disabled`, no `href`),
  and shows its reason under the label at 12px / 16 in `side-muted`, wrapping
  rather than cut; on the collapsed rail it sits at opacity .5. Expanded,
  every row carries its label as its native `title`. On the collapsed rail a
  row drops that `title` and shows its name, and only its name, in the shared
  Tooltip instead — right of the row, 6px away, centred on it, on one line
  that grows over the page and flips or shifts at the viewport edge; it opens
  after the hover delay or at once on keyboard focus, closes on Escape, and is
  `aria-hidden`, so the row's accessible name is read once. A section note
  (a group with no rows) is 12px / 16 `side-muted` and wraps. A section label
  stays on one line with an ellipsis and carries its full text as its `title`,
  so the operator's "Tenant · {name}" group reads on hover; the "Platform
  actions" rows take the row colours with a neutral "platform" pill.
  The sidebar is an `<aside id="sidebar">` named "Sidebar"; its brand row is
  the Shinefold full logo (`BrandLogo`, 28px tall) with a 12px `side-muted`
  "Platform" under its lettering expanded, and the S box alone (`BrandMark`,
  28px), centred, collapsed. The full logo's lettering is `logo-ink`
  (#12141a light, #e8eaef dark); each logo is one image named "Shinefold"
  (docs/brand/README.md).
- Every page's tab title is "<page> · Shinefold": the `[locale]` root layout
  sets the title template and the default "Shinefold", and each page's
  `pageMetadata` key holds the page name alone. The tab and home-screen icon
  is the S box, served by `app/icon.ts` (SVG), `app/apple-icon.tsx` (180px
  PNG on yellow), `/favicon.ico` (16, 32 and 48px, for browsers that skip the
  SVG) and listed in `app/manifest.ts`, all drawn from
  `@blog/utils/shinefold-logo`; the proxy leaves `/icon` and `/apple-icon`
  unrewritten. The collapse toggle is the topbar's first item from
  `md` (below `md` that slot holds the phone Menu button and the toggle never
  renders): a 36×36 `control-line` box on `surface` with the unrotated 16px
  `ICONS.SIDEBAR` glyph in `muted`, hovering and focusing to a `brand-ink`
  border and `text` icon, focus adding the `bg`-gapped `brand-ink` ring. It is
  named "Collapse sidebar" or "Expand sidebar" with `aria-expanded` and
  `aria-controls="sidebar"`, carries no native `title`, and shows that name in
  the shared Tooltip below it, left-aligned, 6px away. The topbar is 59px tall
  from `md` and 67px below it, and `--spacing-platform-topbar` (a media-query
  override of `--platform-topbar`) holds that real height, so
  `scroll-pt-platform-topbar` anchors and every `top-platform-topbar` sticky panel
  sit flush under the bar.
  Only the sidebar's nav area scrolls: the brand row and the Workspace field
  stay at the top and the foot at the bottom. The foot (12px padding, a 1px
  `side-line` top rule) holds `AccountMenu`, from
  `components/features/layout/account-menu/`. Expanded, its trigger is full
  width and 52px tall: padding 8px 10px, a 10px gap, a 1px
  `control-line-tint` border, `rounded-platform`, transparent; a 30px `brand`
  circle avatar with white initials, the name (13px/600 `text`, 18px line,
  its full text as `title`) over the email (12px `muted`, 16px line), each
  cut with an ellipsis, and a 16px `muted` up chevron. With no name the email
  takes the name line, there is no email line, and the avatar shows the
  email's first letter. Hover takes a `side-raised` ground; open adds a
  `side-accent` border; focus is the side-gapped ring. Collapsed, the trigger
  is the 52×52 avatar alone, titled by the name and named "Account: {name},
  {email}" ("Account: {email}" with no name). The menu, named "Account" on
  the shared popup frame, opens 6px above the trigger from its left edge, at
  least its width and growing to fit a long email up to 300px, never wider
  than the viewport less 16px, or, from
  the rail, to its right (`sideOffset` 20) at 240px with its bottom aligned
  to the trigger's. It heads with the name, the email and the role line
  ("{role} · {scope}"), none focusable, then — in the expanded and the rail
  menu — a Theme section, then the Sign out item, which takes focus on open
  from the sidebar.
  The Theme section is the shared `MenuRadioGroup`
  (`components/shared/menu-radio-group/`) at its desktop size: a "Theme"
  group of Light (sun), Dark (moon) and System (monitor) `menuitemradio`
  items, described by "System follows your device setting.", with the stored
  choice checked (System when none is stored). Choosing one writes the
  `platform-theme` cookie and sets or clears `data-theme` on `<html>` at once,
  without a reload and without closing the menu; the menu reads the current
  choice back from `<html>`, since the root layout never re-renders on client
  navigation, and follows a choice made in the embedded Studio's Appearance
  menu, which writes the same preference (`embedded-studio.md`). The top bar
  carries no account control at any width: below `md` the account lives at
  the foot of the phone Menu (below).
  The Workspace field is a `side-field` plate with a `side-field-line` border
  and the raised shadow, its border `side-accent` while its dropdown is open;
  its initials are `brand-strong` at 700 on `brand-weak`, its name `text`, its
  domain `muted` in the Mono font and its chevron `muted`. It carries the
  active workspace's full name as its `title`, so a name cut by its ellipsis
  reads on hover. Focused, it shows the side-gapped ring in place of its
  shadow. The field is 52px tall at full sidebar width: padding 8px 8px 8px
  10px, a 9px gap, `rounded-platform-control`, the 22×22 initials avatar, the
  name (13px/600) on an 18px line over the domain (11px Mono) on a 16px line,
  each cut to one line with an ellipsis, and one unrotated 16px down chevron;
  it carries no "Workspace" label. Its dropdown opens 4px below it,
  left-aligned, on the shared popup frame, at least the field's width and
  growing to fit a long name or domain up to 300px, never wider than the
  viewport less 16px (`MENU_POPUP_FIT_WIDTH`). Each item is
  the name (13px/500 `text`) over the Mono domain (11px `muted`), padding 6px
  8px, `rounded-platform-control`, wrapping long text in full; the highlighted
  item takes a `popover-hover` ground and no focus ring, and below `md` every
  item is at least 44px tall with its lines centred. The current workspace
  carries no visual marker; its item has `aria-current` for screen readers.
  The onboarding rail and the Choose a workspace page read the
  separate `rail` tokens and stay dark.
- The platform's colours are near-black and yellow. In Light, `brand` and
  `brand-ink` are near-black (#12141a) with `brand-strong`/`brand-hover`
  #2a303b, and yellow is the highlight: `brand-weak` #fff1c2, `brand-line`
  #ffd766 and `highlight` #ffc233. In Dark, yellow leads: `brand` #ffc233,
  `brand-ink` #ffdc7a (lifted from #ffd466 so a focused field's border keeps 3:1 against its resting border), `brand-strong` #ffe08a, `brand-hover` #ffcf5c,
  `brand-weak` #33290d, `brand-line` #5c4a14. `side-accent` follows `brand`;
  the Look preview's `follow-mark` is #ffc233 with a `follow-mark-ink`
  #12141a edge and label in both themes, since it sits over a site preview
  whose scheme is its own; `rail-accent` is #ffc233 in both; `note-line`
  is `brand` at 30%. `warn` is orange (#9a3d0b on #fdeee4 / #ffa066 on
  #2e1a10), so a warning never reads as the brand; `ok` and `bad` are
  unchanged. A primary button, an avatar and the active step put
  `on-brand-ink` on `brand`. A selected chip or jump-index tab
  is `on-selected` on `selected` (`selected-hover` on hover): solid near-black
  with a white label in Light, `brand-ink` yellow on the dark yellow tint in
  Dark, so a selected tab or chip is never yellow in Light. A switch that is on has
  a `brand` track and a `switch-thumb-on` thumb (yellow / near-black). A
  focused field takes a `brand-ink` border, kept over an invalid field's
  `bad-line` border, and a 3px `brand-line` glow (`shadow-platform-focus-glow`).
  The phone save footer's disabled or busy Save is the neutral
  `pill-neutral` ground with `muted` text and a `control-line-locked`
  border. A link
  is `brand-ink` (or `brand-strong`) with a 2px `highlight` underline 3px
  below it. The sidebar's current row is `side-raised` with a `side-accent`
  bar and `brand-ink` text.
- The platform has a dark palette. `:root` holds the light values with
  `color-scheme: light`; `:root[data-theme='dark']` holds the dark value of
  every colour and shadow token with `color-scheme: dark`, so native
  scrollbars and form controls follow; and
  `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`
  repeats those dark values, so with no stored choice the platform follows the
  device setting, live, without a reload. The stored choice is
  `THEME_PREFERENCE` (Light, Dark or System) in the per-device
  `platform-theme` cookie; the root layout reads it and sets
  `data-theme='light'` or `'dark'` on `<html>` (none for System, or for an
  unrecognised value), so the first paint already has the chosen theme on
  every page, sign-in and onboarding included. The `rail` tokens, `scrim`,
  `frame-track` and `frame-thumb` have no dark value: the rail is dark in both
  themes, and the preview scrollbar follows the preview's own Light / Dark,
  never the platform theme: the device frame draws it with `frame-track` /
  `frame-thumb` in a Light preview and `frame-track-dark` /
  `frame-thumb-dark` in a Dark one. The tenant site preview and the email preview body
  are unaffected. `on-brand-ink` (#ffffff / #0f1115) is the label or mark on
  a `brand`, `brand-ink` or tone fill — the primary button, the active chip,
  the selected preset card's tick, and the step indicator's numbers — and `preview-stage`
  (#eef0f3 / #1d2027) is the preview frame's stage ground. The selected
  preset card takes a `brand-ink` border and dot with a `brand-weak` halo.
  The shared Tooltip sits on `tooltip` (#12141a / #262b35) with a
  `tooltip-line` edge. The toast follows the theme with the popover look
  (`popover` ground, `popover-line` border, `shadow-platform-lg`), `text` copy
  and a `muted` time and key hint. Each state has a 3px left edge, clipped
  by the toast's radius, and an `Icon` in its colour: `ok`, `brand-ink`,
  `warn` and `bad`. Toast and `Alert` read the same `STATUS_ICON` map from
  `components/shared/icon/`.
- The platform's Mono font is JetBrains Mono, from
  `config/font-loaders/jetbrains-mono-font.ts`, applied on the platform `<body>`
  and read through `--font-platform-mono` (`font-platform-mono`), with
  `ui-monospace, monospace` behind it.
- Shell popups share one frame, `menuSurfaceVariants`' `popup` slot in
  `components/shared/menu-surface/`: `popover` ground, 1px `popover-line`
  border, `rounded-platform` on every corner, 4px padding, `text` colour and
  `shadow-platform-lg`. Its `positioner` slot puts every shell popup — the
  phone Menu, the full-path menu, the account menu, the Workspace dropdown,
  `Select` and More presets — on one layer, `z-30`: above the sticky
  `ViewTabs` (`z-21`) and `LookJumpIndex` (`z-20`), below dialogs (`z-40`)
  and toasts and tooltips (`z-50`). The phone Menu (`TopbarNavMenu`) uses it with 6px padding,
  288px wide. It is anchored to the Menu button's left edge and the top bar's
  full height (`use-bar-anchor.ts`), so it opens 5px below the bar and grows
  with its content until it stops 12px above the viewport's bottom (Base UI's
  `--available-height`). The popup never scrolls; it holds three zones. A pinned
  top zone (padding 6px 6px 10px, a `popover-line` rule below) holds the
  Workspace switcher and renders only when the switcher does. A scrolling
  middle zone (padding 0 2px 8px; sections 10px 4px 0) holds the sidebar's
  sections, labels and notes in `muted`, its rows in the sidebar row shape at
  least 44px tall, 13px/400 `text` with `muted` icons and `title` = the label
  (none on a row with a status line): highlight and hover take a
  `popover-hover` plate with no ring; the current row adds a 3px `brand-ink`
  bar (`w-platform-bar`, shared with the sidebar's current row) flush left,
  inset 10px, a 600 label and a `text` icon. A pinned foot
  zone (padding 8px 2px 2px, a `popover-line` rule above) holds `AccountMenu`
  in its expanded form. The Menu wraps both pinned zones in
  `NestedMenuProvider` (`context/nested-menu-provider/`), so `TenantSwitcher`
  and `AccountMenu` open through `NestableMenuRoot`/`NestableMenuTrigger`
  (`components/shared/nestable-menu-root/` and `nestable-menu-trigger/`) as Base UI submenus: their triggers
  are menu items in the Menu's arrow-key order (switcher, rows, account) on a
  `side-field` ground with a `side-field-line` border, a `popover-hover`
  hover, a `side-accent` border while open and the popover-gapped ring. The
  switcher's dropdown opens 6px below it and the account menu 6px above the
  foot, each at least its trigger's width (the account menu exactly it), with
  the Menu open behind; Escape closes
  the inner popup onto its trigger, a second Escape closes the Menu onto its
  button, and choosing a workspace closes both. The Menu button takes a
  `brand-ink` border on hover, focus (with the bg-gapped ring) and open, and
  a `text` icon while open. It is named "Menu", carries no native `title`,
  and shows that name in the shared Tooltip below it, left-aligned, 6px away.
  Its inert rows are disabled menu items (`role="menuitem"`,
  `aria-disabled`, outside Base UI's item list), so arrow keys skip them and
  they take no focus; they keep the enabled rows' label and icon colours and
  change nothing on hover. Its neutral pills sit on `pill-neutral-popover`,
  not the page's `pill-neutral`. Its `item` slot (the account menu's Sign
  out) is a flex row with a 10px gap, at least 44px tall at every width,
  padding 6px 8px,
  `rounded-platform-control`, 13px/500, 2px from the next item, taking a
  `popover-hover` ground and no ring when highlighted.
- `styles/platform-theme-contrast.test.ts` guards both palettes: each pair
  of token names must meet 4.5:1 for text and 3:1 for borders, icons, tracks
  and focus rings, measured from the values in `platform-theme.css`, and the
  device-dark block must repeat the chosen-Dark block exactly.
- Focus is one gapped ring, built by
  `utils/focus-ring-classes/focus-ring-classes.ts` for a named
  `FOCUS_RING_GROUND` (side, bg, surface, surface-2, surface-head, popover,
  theme-track): a 2px gap in that ground, then a 2px `brand-ink` ring
  (`side-accent` on the sidebar), with no visible outline outside forced-colors mode. Text inputs, textareas
  and the rich-text editor take no ring: focused, their border turns
  `brand-ink` inside a 3px `brand-line` glow (`FIELD_FOCUS_CLASSES`,
  `utils/field-surface-classes/`). The ring sits on `surface` for checkboxes, select
  triggers, closed accordion triggers (an open one takes it on `surface-2`), underline view tabs, preset cards, the
  hue slider's thumb (focused or dragged) and the rich-text toolbar buttons;
  segmented options take it on `bg`, and segmented view tabs on `theme-track`. A ring
  that a clipping parent would cut off is drawn inset
  (`insetFocusRingClasses`): the data table's scroll region, and its sort
  buttons, which fill their head cell. The toast's dismiss button takes it
  on `popover`. A raised shadow gives way to the
  ring while focused. Fields have a
  `control-line` border, or `control-line-tint` on a card header or
  toolbar. An invalid field has a `bad-line` border, with its error in
  `bad` text and no icon.
- The topbar breadcrumb never wraps: it fits on one row in whatever width the
  bar leaves it. Every crumb keeps its full width except the tenant name, the
  one crumb marked `isShrinkable`, which truncates to no less than 48px,
  including when it is the current crumb, and carries its full name as
  `title`. The current crumb is capped at 280px with an ellipsis and carries
  its full text as `title` when the cap cuts it off. On a phone every
  breadcrumb link keeps a 44px tap height. Links take the focus ring on `bg`.
- Below `md` a breadcrumb collapses to "…" › second-to-last › leaf, but only
  when a crumb it would hide is a link (the operator tenant pages); a trail
  hiding only the "Platform" label, and every one- or two-crumb trail,
  renders in full, as does every trail from `md` up. The "…" is a 44×44
  `FullPathMenu` button named "Show full path": a `control-line` border on
  `surface`, `brand-ink` on hover and while open, the ring on `bg` on keyboard
  focus only, no tooltip. It opens the "Full path" menu, 220px wide, 7px below
  it with left edges aligned, on the shared popup frame. A hidden crumb with
  no page is a group label (the `groupLabel` slot: 11px/700 uppercase
  `muted`, never focusable) naming the group of links after it; a crumb with
  a page is a link item. Focus lands on the first link; Escape returns it to
  the "…".
- `apps/platform` owns its own primitives on Base UI and never imports
  `@blog/ui` outside `components/features/site-preview/`.
- A busy platform `Button` stays at full colour and keeps focus: it is
  `aria-disabled` and `aria-busy`, never `disabled`, and ignores clicks and
  form submission until it settles. It shows the spinner beside its busy
  label, and holds the wider of its idle and busy widths so it never resizes.
  On `primary` the spinner reads on the brand fill — a yellow and an
  off-white half on near-black in Light, the one-colour form in the label's
  colour on yellow in Dark; every other variant shows the one-colour form in
  its text colour. This is fixed, not a setting; the `unstyled` variant keeps
  its own layout and does not hold its width.
- The platform `Spinner` is the Shinefold logo's folded o: at rest a disc
  creased from upper right to lower left, its upper-left half lit. In a
  three-second loop the halves part along the crease, each rounds into a small
  circle, the circles go twice round the centre, then turn back into halves
  and close. It comes at 14, 18 and 24px. Its default two-colour form lights
  the half in brand yellow over a `logo-ink` half (near-black in Light,
  off-white in Dark); its one-colour form draws a solid half and an outlined
  half in the surrounding text colour. With reduced motion it is the still
  disc. It is a `status` named by its label, which it can also show beside
  it.

## Dependencies

- `@blog/db` (`queries.admins`, `queries.memberships`, `queries.tenants`,
  `PLAN_REGISTRY`), `@blog/auth` through `server/auth/auth.ts`, `@blog/config`
  (`ICONS`, `LOCALE_ISO_CODES`).
- Features: [platform-sign-in-and-onboarding](./platform-sign-in-and-onboarding.md),
  [tenant-access](./tenant-access.md), [embedded-studio](./embedded-studio.md),
  [plans-and-entitlements](./plans-and-entitlements.md),
  [audit-and-findings](./audit-and-findings.md).
- Env: `AUTH_SECRET` (via `@blog/auth`), `DATABASE_URL` (via `@blog/db`).

## Entry points

- `apps/platform/src/app/[locale]/layout.tsx` (providers), and the three
  `PlatformShell` trees: `(operator)/layout.tsx`,
  `tenants/[tenantId]/(detail)/layout.tsx`, `dashboard/(tenant)/layout.tsx`.
- `apps/platform/src/components/features/layout/platform-shell/platform-shell.tsx`
- `apps/platform/src/server/auth/list-session-tenants.ts`,
  `apps/platform/src/server/auth/resolve-dashboard-tenant.ts`
- `apps/platform/src/utils/nav-sections/nav-sections.ts`,
  `apps/platform/src/utils/routes/routes.ts`, `apps/platform/src/proxy.ts`

## Tests and stories

- Vitest suites beside the layout components and the shell helpers
  (`server/layout`, `server/tenant-pages`, `list-session-tenants`,
  `resolve-dashboard-tenant`, `nav-sections`, `routes`), plus
  `app/api/dashboard/select-tenant/route.test.ts`, `i18n/routing.test.ts` and
  `proxy.test.ts`, and the palette contrast guard
  `styles/platform-theme-contrast.test.ts`. `apps/platform` has no Storybook.

## Related

- #4979 epic: web and platform stay separate (language, sign-in, sessions).
- #4980 the platform takes its language from the browser, not the site's cookie.
- #4840 epic: platform front door.
- #4959 owner provisioning status, overview card and Studio access states in
  the sidebar.
