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
  - apps/platform/src/utils/tenant-switcher-items/**
  - apps/platform/src/context/unsaved-changes-provider/**
  - apps/platform/src/components/shared/guarded-link/**
  - apps/platform/src/components/shared/button/**
  - apps/platform/src/components/shared/menu-surface/**
  - apps/platform/src/i18n/**
  - apps/platform/src/proxy.ts
  - apps/platform/src/styles/admin-theme*
epics: [4979, 4980, 4840, 4959]
---

# Platform shell

## What it does

The chrome every signed-in page of `apps/platform` renders inside: a sidebar of
nav sections, a topbar with a breadcrumb and an account menu, and a content
column. It comes in three gated trees: the operator's Platform section, the
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

## Data

- Neon: `admins` (role), `memberships` and `tenants`, read through
  `@blog/db` queries; nothing is written except the cookies below.
- Cookies: `admin-active-tenant` (httpOnly, 30 days, set only by the
  select-tenant route), `admin-sidebar-collapsed` (client-written, one
  year; read server-side for the first render) and the per-tenant
  `studio-entered-<tenantId>` (client-written, one year), which the
  `/dashboard` layout reads to drop the Studio item's Ready badge
  (`embedded-studio.md`).
- Request caching: `listSessionTenants`, `resolveDashboardTenant`,
  `requireAdmin` and `requireTenantById` are React `cache()`-wrapped, so a
  layout and its page share one lookup per request. Nothing is cached across
  requests.

## Configuration

- Nav items come from `nav-sections.ts`: `operatorNavSections`,
  `tenantNavSections` and `dashboardNavSections`.
- On `/dashboard`, the plan decides which items appear (`planPageAccess`, see
  [plans-and-entitlements](./plans-and-entitlements.md)): Languages needs more
  than one plan locale, Email a mail-sending capability, and the inert "Coming
  soon" rows Subscribers NEWSLETTER, Comments COMMENTS, Team any plan but FREE.
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
- The role chip never shows a virtual membership's OWNER role; it shows the
  admin role behind it.
- Plan-gated dashboard pages go through `renderTenantScopedPage`, which 404s
  when the plan lacks the page. It is called as a function, never as JSX.
- The tenant layouts render the sidebar once and keep it across client
  navigation, so a badge that can change while the owner stays in
  `/dashboard` must refresh the route itself. The Studio badge does: the
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
  The Workspace field is a `side-field` plate with a `side-field-line` border
  and the raised shadow, its border `side-accent` while its dropdown is open;
  its initials are `brand-strong` at 700 on `brand-weak`, its name `text`, its
  domain `muted` in the Mono font and its chevron `muted`. It carries the
  active workspace's full name as its `title`, so a name cut by its ellipsis
  reads on hover. Focused, it shows the side-gapped ring in place of its
  shadow. The onboarding rail and the Choose a workspace page read the
  separate `rail` tokens and stay dark.
- The admin's Mono font is JetBrains Mono, from
  `config/font-loaders/jetbrains-mono-font.ts`, applied on the admin `<body>`
  and read through `--font-admin-mono` (`font-admin-mono`), with
  `ui-monospace, monospace` behind it.
- Shell popups share one frame, `menuSurfaceVariants`' `popup` slot in
  `components/shared/menu-surface/`: `popover` ground, 1px `popover-line`
  border, `rounded-admin` on every corner, 4px padding, `text` colour and
  `shadow-admin-lg`. The phone Menu (`TopbarNavMenu`) uses it with 6px padding,
  and its section labels and notes read `muted` and its rows `text` on that
  ground.
- `styles/admin-theme-contrast.test.ts` guards the light palette: each pair
  of token names must meet 4.5:1 for text and 3:1 for borders, tracks and
  focus rings, measured from the values in `admin-theme.css`.
- Focus is one gapped ring, built by
  `utils/focus-ring-classes/focus-ring-classes.ts` for a named
  `FOCUS_RING_GROUND` (side, bg, surface, surface-head, popover,
  theme-track, toast): a 2px gap in that ground, then a 2px `brand-ink` ring
  (`side-accent` on the sidebar), with no visible outline outside forced-colors mode. Text inputs, textareas
  and the rich-text editor take it on `surface`, as do checkboxes, select
  triggers, accordion triggers, underline view tabs, preset cards, the
  hue slider's thumb (focused or dragged) and the rich-text toolbar buttons;
  segmented options and segmented view tabs take it on `theme-track`. A ring
  that a clipping parent would cut off is drawn inset
  (`insetFocusRingClasses`): the data table's scroll region, and its sort
  buttons, which fill their head cell. The toast's dismiss button is the one
  exception: the same gap in the toast's ground with a fixed white ring,
  since `brand-ink` is under 3:1 there. A raised shadow gives way to the
  ring while focused. Fields have a
  `control-line` border, or `control-line-tint` on a card header or
  toolbar. An invalid field has a `bad-line` border, with its error in
  `bad` text and no icon.
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
  `proxy.test.ts`, and the light-palette contrast guard
  `styles/admin-theme-contrast.test.ts`. `apps/platform` has no Storybook.

## Related

- #4979 epic: web and platform stay separate (language, sign-in, sessions).
- #4980 the admin takes its language from the browser, not the site's cookie.
- #4840 epic: platform front door.
- #4959 owner provisioning status, overview card and Studio access states in
  the sidebar.
