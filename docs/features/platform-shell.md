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
  - apps/platform/src/utils/routes/**
  - apps/platform/src/utils/active-tenant-cookie/**
  - apps/platform/src/utils/sidebar-collapsed-cookie/**
  - apps/platform/src/utils/tenant-switcher-items/**
  - apps/platform/src/context/unsaved-changes-provider/**
  - apps/platform/src/components/shared/guarded-link/**
  - apps/platform/src/components/shared/button/**
  - apps/platform/src/i18n/**
  - apps/platform/src/proxy.ts
epics: [4979, 4980, 4840, 4959]
---

# Platform shell

## What it does

The chrome every signed-in page of `apps/platform` renders inside: a sidebar of
nav sections, a topbar with a breadcrumb and an account menu, and a content
column. It comes in three gated trees: the operator's Platform section, the
operator's view of one tenant, and the owner's `/dashboard`, which never shows
that the platform hosts more than one tenant. The 404, error and
`/dashboard/select-tenant` pages use a smaller pre-shell frame.

## Surfaces and routes

URLs carry no locale prefix (next-intl `localePrefix: 'never'`).

- **Operator Platform section**, the `(operator)` group: `/tenants`,
  `/tenants/new`, `/findings`. `/` redirects an admin to `/tenants`. The
  tenants table opens newest first; each column header sorts it and a second
  click reverses, and a search field narrows it by name or domain (which
  carries the slug). Visibility, sort and search live in the URL
  (`?archived=1&sort=<column>&direction=<ascending|descending>&q=`), so a
  reload or shared link keeps them; `listTenants`' own default order stays by
  name, which the dashboard tenant picker relies on.
- **Operator tenant view**: `/tenants/{id}` and its Look, Voice, Features,
  Languages, Domain, Email, Studio, Provisioning and Danger zone pages. The
  sidebar shows the Platform section plus the tenant's own sections.
- **Owner dashboard**: `/dashboard` and its Look, Voice, Features,
  Languages, Domain, Email and Studio pages. `/dashboard/select-tenant` is a
  picker for a user with several workspaces.
- `GET /api/dashboard/select-tenant?tenantId=` sets the active-workspace
  cookie and redirects to `/dashboard`.
- Every other path 404s through a catch-all. `not-found.tsx` renders
  `DeadEndView` with a home link from `resolveHomeHref` (sign-in, `/tenants`
  for an admin, `/dashboard` otherwise); `error.tsx` offers only Retry.

Below `md` the sidebar is hidden and `TopbarNavMenu` carries the same sections.
The Studio segment switches the content column to full-bleed (see
[embedded-studio](./embedded-studio.md)).

## Data

- Neon: `admins` (role), `memberships` and `tenants`, read through
  `@blog/db` queries; nothing is written except the cookies below.
- Cookies: `admin-active-tenant` (httpOnly, 30 days, set only by the
  select-tenant route) and `admin-sidebar-collapsed` (client-written, one
  year; read server-side for the first render).
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
- `adminRoutes` is the only place platform URLs are built.
- The shell's `Link` is `GuardedLink`, which asks before leaving a page with
  unsaved changes.
- The admin's language is next-intl's: the `NEXT_LOCALE` cookie first, then
  the browser's language, falling back to English.
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
  `proxy.test.ts`. `apps/platform` has no Storybook.

## Related

- #4979 epic: web and platform stay separate (language, sign-in, sessions).
- #4980 the admin takes its language from the browser, not the site's cookie.
- #4840 epic: platform front door.
- #4959 owner provisioning status, overview card and Studio access states in
  the sidebar.
