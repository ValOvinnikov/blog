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
  - apps/platform/src/styles/admin-theme*
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
  setup card (while setup is incomplete or failed), the Your site band, the
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
edge: 64px tall, flat, top border and `shadow-admin-dock`. It shows a dot,
"N unsaved changes", the "⌘S / Ctrl+S" hint (from `lg` only), Discard and Save
changes. With invalid fields the left side becomes "N fields need attention",
"Go to the first one" and "Not saved" — one line from `lg`, stacked on two
lines from `md` to `lg` — and the dot, count and hint go. While saving, Save
reads "Saving…" through the Button's pending state (focus stays on it),
Discard is disabled and the bar is `aria-busy`. A save that fails with no
field errors — a server error, offline, or a plan refusal — shows the page's
failure message in the bar's left side in place of the dot, count and hint, as
one `role="alert"`, and the changes stay unsaved; invalid fields keep that slot
until they are cleared. The next edit or a successful save clears it. Only when
no bar shows (a plan refusal that restored every refused value) does the
message sit in an error `Alert` under the header. From `md` the page keeps 120px of room below its last content (48px
when archived), and the document's `scroll-padding-bottom` is the bar's 64px
plus 16px so a focused field never sits under the bar. The 64 and 16 are the
`--spacing-admin-dock` / `-clearance` tokens, kept equal to
`LOOK_LAYOUT_LIMIT`. A page may opt out of the head's "All changes saved"
status (`hasSavedStatus={false}`); Voice does. Below `md` the bar spans the
viewport bottom edge to edge with Discard and Save, and the page keeps 120px
of room while it shows.

Voice opts into its own phone footer below `md` (`layout.hasPhoneSaveFooter`)
in place of that bar; from `md` it docks like every other page. The footer is
fixed to the viewport bottom, full width, flat with a top border, and stays
mounted when clean (never for an archived tenant). It is a region named by its
own status text — "N unsaved changes" with a dot, "All changes saved" with
Save disabled, "N fields need attention" on a first row above "Go to the
first one", or a failed save's message (an alert, while changes remain) — and has Save changes but no Discard and no shortcut hint. While
saving it is `aria-busy` and Save reads "Saving…" and keeps focus; it renders
outside Voice's `inert` content. Below `md` Voice keeps 96px of room
(`--spacing-admin-phone-footer-room`, clearing the 85px two-row error footer,
`--spacing-admin-phone-footer-max`) and a `scroll-padding-bottom` of that 85
plus 16; an archived Voice page ends at 48px.

## Data

- Neon: `admins` (role), `memberships` and `tenants`, read through
  `@blog/db` queries; nothing is written except the cookies below.
- Cookies: `admin-active-tenant` (httpOnly, 30 days, set only by the
  select-tenant route), `admin-sidebar-collapsed` (client-written, one
  year; read server-side for the first render), `admin-theme` (the
  per-device theme preference, one year; read server-side for the first
  render) and the per-tenant
  `studio-entered-<tenantId>` (client-written, one year), which no
  surface reads any more (`embedded-studio.md`).
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
  soon" rows Subscribers NEWSLETTER, Comments COMMENTS, Team any plan but FREE.
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
  `admin-active-tenant` cookie picks it, otherwise the picker opens. The
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
- The admin's language is next-intl's: the `NEXT_LOCALE` cookie first, then
  the browser's language, falling back to English.
- The admin's colours are `--admin-*` tokens in `styles/admin-theme.css`,
  each with a `--color-admin-*` Tailwind colour; shadows read `--admin-shadow`
  and `--admin-shadow-menu`. The light sidebar is grey (`side` #eef0f3 with
  `side-line` rules); its wordmark is `text-strong`, its text `side-text` and
  `side-muted`, and no sidebar text is drawn in `faint`, which is for icons
  and chevrons only. A nav row rests in `side-text` with a `side-muted`
  icon (a colour, never an opacity) and hovers to a `side-line` ground; the
  current page's row is a `side-raised` plate with the raised shadow, its
  text and icon `text-strong` at 600, and a 3px `side-accent` bar on its left
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
  the gradient mark, wordmark and "admin" expanded, and the mark alone,
  centred, collapsed. The collapse toggle is the topbar's first item from
  `md` (below `md` that slot holds the phone Menu button and the toggle never
  renders): a 36×36 `control-line` box on `surface` with the unrotated 16px
  `ICONS.SIDEBAR` glyph in `muted`, hovering and focusing to a `brand-ink`
  border and `text` icon, focus adding the `bg`-gapped `brand-ink` ring. It is
  named "Collapse sidebar" or "Expand sidebar" with `aria-expanded` and
  `aria-controls="sidebar"`, carries no native `title`, and shows that name in
  the shared Tooltip below it, left-aligned, 6px away. The topbar is 59px tall
  from `md` and 67px below it, and `--spacing-admin-topbar` (a media-query
  override of `--admin-topbar`) holds that real height, so
  `scroll-pt-admin-topbar` anchors and every `top-admin-topbar` sticky panel
  sit flush under the bar.
  Only the sidebar's nav area scrolls: the brand row and the Workspace field
  stay at the top and the foot at the bottom. The foot (12px padding, a 1px
  `side-line` top rule) holds `AccountMenu`, from
  `components/features/layout/account-menu/`. Expanded, its trigger is full
  width and 52px tall: padding 8px 10px, a 10px gap, a 1px
  `control-line-tint` border, `rounded-admin`, transparent; a 30px `brand`
  circle avatar with white initials, the name (13px/600 `text`, 18px line,
  its full text as `title`) over the email (12px `muted`, 16px line), each
  cut with an ellipsis, and a 16px `muted` up chevron. With no name the email
  takes the name line, there is no email line, and the avatar shows the
  email's first letter. Hover takes a `side-raised` ground; open adds a
  `side-accent` border; focus is the side-gapped ring. Collapsed, the trigger
  is the 52×52 avatar alone, titled by the name and named "Account: {name},
  {email}" ("Account: {email}" with no name). The menu, named "Account" on
  the shared popup frame, opens 6px above the trigger at its width, or, from
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
  `admin-theme` cookie and sets or clears `data-theme` on `<html>` at once,
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
  10px, a 9px gap, `rounded-admin-control`, the 22×22 initials avatar, the
  name (13px/600) on an 18px line over the domain (11px Mono) on a 16px line,
  each cut to one line with an ellipsis, and one unrotated 16px down chevron;
  it carries no "Workspace" label. Its dropdown opens 4px below it,
  left-aligned at the field's width, on the shared popup frame. Each item is
  the name (13px/500 `text`) over the Mono domain (11px `muted`), padding 6px
  8px, `rounded-admin-control`, wrapping long text in full; the highlighted
  item takes a `popover-hover` ground and no focus ring, and below `md` every
  item is at least 44px tall with its lines centred. The current workspace
  carries no visual marker; its item has `aria-current` for screen readers.
  The onboarding rail and the Choose a workspace page read the
  separate `rail` tokens and stay dark.
- The admin has a dark palette. `:root` holds the light values with
  `color-scheme: light`; `:root[data-theme='dark']` holds the dark value of
  every colour and shadow token with `color-scheme: dark`, so native
  scrollbars and form controls follow; and
  `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`
  repeats those dark values, so with no stored choice the admin follows the
  device setting, live, without a reload. The stored choice is
  `THEME_PREFERENCE` (Light, Dark or System) in the per-device
  `admin-theme` cookie; the root layout reads it and sets
  `data-theme='light'` or `'dark'` on `<html>` (none for System, or for an
  unrecognised value), so the first paint already has the chosen theme on
  every page, sign-in and onboarding included. The `rail` tokens, `scrim`,
  `frame-track` and `frame-thumb` have no dark value: the rail is dark in both
  themes, and the preview scrollbar follows the preview's own Light / Dark,
  never the admin theme: the device frame draws it with `frame-track` /
  `frame-thumb` in a Light preview and `frame-track-dark` /
  `frame-thumb-dark` in a Dark one. The tenant site preview and the email preview body
  are unaffected. `on-brand-ink` (#ffffff / #0f1115) is the mark on a
  `brand-ink` or tone fill — the selected preset card's tick, and the step
  indicator's done, failed and running numbers — and `preview-stage`
  (#eef0f3 / #1d2027) is the preview frame's stage ground. The selected
  preset card takes a `brand-ink` border and dot with a `brand-weak` halo.
  The shared Tooltip sits on `tooltip` (#12141a / #262b35) with a
  `tooltip-line` edge. The toast follows the theme with the popover look
  (`popover` ground, `popover-line` border, `shadow-admin-lg`), `text` copy
  and a `muted` time and key hint. Each state has a 3px left edge, clipped
  by the toast's radius, and an `Icon` in its colour: `ok`, `brand-ink`,
  `warn` and `bad`. Toast and `Alert` read the same `STATUS_ICON` map from
  `components/shared/icon/`.
- The admin's Mono font is JetBrains Mono, from
  `config/font-loaders/jetbrains-mono-font.ts`, applied on the admin `<body>`
  and read through `--font-admin-mono` (`font-admin-mono`), with
  `ui-monospace, monospace` behind it.
- Shell popups share one frame, `menuSurfaceVariants`' `popup` slot in
  `components/shared/menu-surface/`: `popover` ground, 1px `popover-line`
  border, `rounded-admin` on every corner, 4px padding, `text` colour and
  `shadow-admin-lg`. The phone Menu (`TopbarNavMenu`) uses it with 6px padding,
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
  bar (`w-admin-bar`, shared with the sidebar's current row) flush left,
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
  foot, each at its trigger's width, with the Menu open behind; Escape closes
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
  `rounded-admin-control`, 13px/500, 2px from the next item, taking a
  `popover-hover` ground and no ring when highlighted.
- `styles/admin-theme-contrast.test.ts` guards both palettes: each pair
  of token names must meet 4.5:1 for text and 3:1 for borders, icons, tracks
  and focus rings, measured from the values in `admin-theme.css`, and the
  device-dark block must repeat the chosen-Dark block exactly.
- Focus is one gapped ring, built by
  `utils/focus-ring-classes/focus-ring-classes.ts` for a named
  `FOCUS_RING_GROUND` (side, bg, surface, surface-2, surface-head, popover,
  theme-track): a 2px gap in that ground, then a 2px `brand-ink` ring
  (`side-accent` on the sidebar), with no visible outline outside forced-colors mode. Text inputs, textareas
  and the rich-text editor take it on `surface`, as do checkboxes, select
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
  form submission until it settles. It shows a ring spinner in its text colour
  beside its busy label, and holds the wider of its idle and busy widths so it
  never resizes. This is fixed, not a setting; the `unstyled` variant keeps
  its own layout and does not hold its width.

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
  `AdminShell` trees: `(operator)/layout.tsx`,
  `tenants/[tenantId]/(detail)/layout.tsx`, `dashboard/(tenant)/layout.tsx`.
- `apps/platform/src/components/features/layout/admin-shell/admin-shell.tsx`
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
  `styles/admin-theme-contrast.test.ts`. `apps/platform` has no Storybook.

## Related

- #4979 epic: web and platform stay separate (language, sign-in, sessions).
- #4980 the admin takes its language from the browser, not the site's cookie.
- #4840 epic: platform front door.
- #4959 owner provisioning status, overview card and Studio access states in
  the sidebar.
