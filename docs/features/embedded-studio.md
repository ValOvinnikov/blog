---
title: Embedded Studio
status: built
layers: [studio, platform, db, config]
code:
  - packages/studio/src/studio-mount.tsx
  - packages/studio/src/studio-mount.test.tsx
  - packages/studio/src/studio-config.ts
  - packages/studio/src/studio-config.test.ts
  - packages/studio/src/index.ts
  - packages/studio/sanity.config.ts
  - packages/studio/sanity-env.ts
  - apps/platform/src/components/features/studio/**
  - apps/platform/src/app/**/studio/**
  - apps/platform/src/utils/content-security-policy/**
epics: [4840, 4956, 4959, 4035, 1036]
---

# Embedded Studio

## What it does

One Sanity Studio, built from the shared `@blog/studio` package, serves every
tenant. The platform mounts it inside its own shell at a tenant-scoped route
and points it at that tenant's own Sanity project and dataset. Owners edit
their site's content there and operators can open any tenant's. The Studio is
configured per tenant: its languages follow the tenant's live locales, and
module types whose capability is off for the tenant carry a warning.

## Surfaces and routes

- `/dashboard/studio/**`: the owner's Studio for the active workspace.
- `/tenants/{id}/studio/**`: the operator's Studio for any tenant, archived
  ones included.
- Both are `[[...tool]]` catch-alls; the Studio's own router owns everything
  below `basePath`, including structure paths whose ids contain dots. The
  platform proxy skips only root-level dotted paths, so those still resolve.
- The `studio` segment switches the shell to full-bleed: the content column is
  pinned to the viewport and the Studio fills it (`ShellFrame`).
- The sidebar shows a Studio item under "Content" in both trees. Under
  `/dashboard`, the owner's item carries their access state as a badge:
  Invite sent, Activating, Ready or Action needed (STALLED).
- Outside the platform, `pnpm --filter @blog/studio dev` runs the same config
  standalone through the Sanity CLI (`sanity.config.ts`, title "Blog").

## Data

- Neon `tenants`: `sanityProjectId`, `sanityDataset` and
  `sanityReadTokenEncrypted` decide whether the Studio can mount at all;
  `deprovisionedAt` decides whether it is replaced by the archived notice.
  `locale`, `additionalLocales` and `plan` give the live locales
  (`selectLiveLocales`).
- Neon `tenants` owner-access columns (`ownerInviteSentAt`,
  `ownerInviteAcceptedAt`, `ownerSanityUserId`, `ownerSanityRole`,
  `ownerLoginProvider`) and the `OWNER_ELEVATION` step's outcome give the
  owner's access state, derived in `ownerStudioAccessFor`: READY once both
  `ownerInviteAcceptedAt` and `ownerSanityUserId` are recorded (the worker
  writes them together when it grants administrator; a later change to
  `ownerSanityRole` does not undo it), ACTIVATING while only one is,
  STALLED once the worker reports a stall, INVITE_SENT otherwise. With no
  recognisable owner-elevation outcome, STALLED falls back to the invite's
  age against `OWNER_ACCESS_STALL_AFTER_MS`, the worker's own threshold.
- Neon `settings_features`: the saved capability toggles, clamped to the plan's
  entitlement (`getEnabledCapabilities`), become `enabledCapabilities`.
- Content lives in the tenant's own Sanity project and dataset; the Studio
  reads and writes it from the browser. Nothing in the platform caches it.
  Publishing triggers the tenant's revalidation webhook (see
  [rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- No Studio setting is edited in the platform itself. The owner or operator
  changes its inputs elsewhere: languages on the Languages page
  ([languages](./languages.md)), capabilities on the Features page
  ([plans-and-entitlements](./plans-and-entitlements.md)).
- A capability that is off does not hide a module type. The type's title gets
  "(off in Features)" in array insert menus, an inserted item carries a
  validation warning, and a document of that type shows a caution banner.
  `module_newsletter` (NEWSLETTER) and `module_contactForm` (CONTACT_FORM)
  are mapped to a capability.
- A module type outside the `entitlements` prop's module packs is not hidden
  either: it reads "(Growth plan)" in the picker, offers no document to pick, can't
  be created new, and
  its documents and page references carry the plan warning instead
  ([plans-and-entitlements](./plans-and-entitlements.md)).
- With a single live locale the language filter is hidden and
  single-language inputs apply.
- Look and Voice do not reach the Studio; its UI is Sanity's own, in English.

## Constraints and invariants

- `StudioMount` takes plain props only (`projectId`, `dataset`, `basePath`,
  `title`, `enabledCapabilities`, `entitlements`, `defaultLocale`,
  `liveLocales`, `loginProvider`) and calls
  `buildStudioConfig` itself. It is the only `'use client'` file in
  `@blog/studio`. Nothing exports a built config: calling the builder in a
  Server Component pulls the Sanity SDK into the RSC graph, where `swr`,
  Sanity's bundled CSS and `sanity-plugin-media` break.
- With `loginProvider` (a `SANITY_LOGIN_PROVIDER` value) set, the login
  screen offers only that Sanity provider and redirects straight to it;
  without it, Sanity's default provider list shows. A provider missing from
  Sanity's list falls back to the full list, so the owner is never left
  without a way in.
- `apps/platform` reaches Sanity only through `StudioMount`. ESLint bans
  `sanity`, `next-sanity`, `@sanity/*`, `groqd` and `@blog/service` there.
- `StudioMount` fills its parent (`height: 100%`) instead of `NextStudio`'s
  `100vh` and adds no global styles of its own. The Studio's Inter
  `@font-face` stays loaded on every platform route after one visit.
- `StudioMountView` renders, in order: the archived notice for a deprovisioned
  tenant; a "Studio isn't ready yet" warning while project, dataset or read
  token is missing; otherwise the mount, titled with the tenant name.
- **The owner's access gate** applies only when the viewer is the tenant's
  own OWNER (a real membership, not an admin's virtual one) and the worker
  has recorded an invite (`ownerInviteSentAt`). Before READY,
  `/dashboard/studio` shows an explainer whose actions call the worker's
  owner-access routes, each state leading with its next step: INVITE_SENT
  offers Check now (primary) then Resend invite; ACTIVATING offers only Check
  now (secondary); STALLED leads with Resend invite (primary), then Check now.
  The buttons share one wrapping row, and while one runs the other is
  disabled. The
  INVITE_SENT explainer says the invite comes by email from Sanity and that
  editing needs a free Sanity account, since Sanity offers no direct invite
  link. At READY the Studio mounts with the owner's recorded `loginProvider`,
  so it offers only that sign-in method and skips the choice screen: one
  click, or none with a live Sanity session. READY is read from stored
  columns, so the gate never closes again. Every other viewer gets the Studio
  as before: operators, editors, and tenants provisioned before the worker.
- The route is gated by the shell: `resolveDashboardTenant` on `/dashboard`
  and `requireTenantById` (any admin role) on `/tenants/{id}`. Neither page is
  plan-gated.
- What the browser may read or write is decided by Sanity. The user signs
  into Sanity with their own account, and the tenant project's member roles
  apply. The platform session only gates the route.
- The tenant project must allow the platform origin as a credentialed CORS
  origin. Provisioning adds it from `PLATFORM_APP_BASE_URL`
  ([tenant-provisioning](./tenant-provisioning.md)).
- The platform CSP allows the Studio: `connect-src https://*.sanity.io
https://sanity-cdn.com`, `img-src https://cdn.sanity.io` plus GitHub and
  Google avatars, and `font-src https://design-system-static.sanity.io`.
- `buildStudioConfig` removes the bare templates of translated page types (the
  i18n plugin adds one per language), gives `migration-state` documents no
  actions and no "new document" entry, and wraps the landing page's publish
  action with landing redirects ([landing-tree](./landing-tree.md)).

## Dependencies

- `@blog/studio` (schema, structure, plugins: structure, vision, code input,
  media, document internationalization, internationalized arrays).
- `@blog/db` for the tenant row, live locales and `PLAN_REGISTRY`;
  `@blog/config` for `TCapability` and `LOCALE_ISO_CODES`.
- Features: [studio-authoring](./studio-authoring.md) (schema and desk
  structure), [platform-shell](./platform-shell.md),
  [tenant-provisioning](./tenant-provisioning.md),
  [module-system](./module-system.md), [languages](./languages.md).
- Env: none in the platform for the mount (ids come from the tenant row). The
  standalone CLI Studio reads `SANITY_STUDIO_PROJECT_ID` and
  `SANITY_STUDIO_DATASET`.

## Entry points

- `packages/studio/src/studio-mount.tsx`
- `packages/studio/src/studio-config.ts`
- `apps/platform/src/components/features/studio/studio-mount-view/studio-mount-view.tsx`
- `apps/platform/src/components/features/studio/dashboard-studio-view/dashboard-studio-view.tsx`
- `apps/platform/src/components/features/studio/owner-studio-access-view/owner-studio-access-view.tsx`
- `apps/platform/src/utils/owner-studio-access/owner-studio-access.ts`
- `apps/platform/src/server/owner-access/{check-owner-access,resend-owner-invite}-action.ts`
- `apps/platform/src/app/[locale]/dashboard/(tenant)/studio/[[...tool]]/page.tsx`
- `apps/platform/src/app/[locale]/tenants/[tenantId]/(detail)/studio/[[...tool]]/page.tsx`
- `apps/platform/src/server/settings-features/get-enabled-capabilities.ts`
- `apps/platform/src/utils/content-security-policy/content-security-policy.ts`

## Tests and stories

- `packages/studio/src/studio-mount.test.tsx` and
  `packages/studio/src/studio-config.test.ts`.
- `apps/platform/src/components/features/studio/studio-mount-view/studio-mount-view.test.tsx`,
  `owner-studio-access-view/owner-studio-access-view.test.tsx`, the dashboard
  Studio page test, `utils/owner-studio-access/owner-studio-access.test.ts`
  and `server/owner-access/request-owner-access.test.ts`.
- `apps/platform/src/utils/content-security-policy/content-security-policy.test.ts`.
- Capability and plan warnings: `packages/studio/src/schema-types/inputs/requirement-warning-input/*.test.ts`.
- Login provider: `packages/studio/src/auth/login-provider-auth.test.ts`.
- No Storybook in either workspace.

## Related

- #4840 epic: platform front door. Owner Studio access becomes a worker job,
  and the mount happens only once access is READY.
- #4959 owner Studio access states in the sidebar and the explainer before
  READY.
- #4035 localize the Studio interface for editors.
- #1036 draft preview with Sanity Presentation.
