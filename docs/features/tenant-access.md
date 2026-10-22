---
title: Tenant access
status: built
layers: [db, auth, email, platform]
code:
  - packages/db/src/schema/memberships.ts
  - packages/db/src/schema/membership-invites.ts
  - packages/db/src/schema/admins.ts
  - packages/db/src/constants/admin.ts
  - packages/db/src/constants/membership.ts
  - packages/db/src/queries/memberships/**
  - packages/db/src/queries/membership-invites/**
  - packages/db/src/queries/admins/**
  - packages/db/scripts/seed-admin.ts
  - packages/auth/src/events/**
  - packages/auth/src/providers/magic-link/find-pending-invite-tenants/**
  - apps/platform/src/server/auth/require-*.ts
  - apps/platform/src/server/auth/is-super-admin*.ts
  - apps/platform/src/server/auth/build-virtual-admin-membership*.ts
  - apps/platform/src/server/auth/list-session-tenants*.ts
  - apps/platform/src/server/auth/resolve-*.ts
  - apps/platform/src/app/api/dashboard/select-tenant/**
  - apps/platform/src/app/**/select-tenant/*.tsx
  - apps/platform/src/utils/active-tenant-cookie/**
  - apps/platform/src/components/features/layout/tenant-switcher/**
  - apps/platform/src/components/features/layout/dashboard-tenant-picker/**
  - packages/db/src/queries/blocked-signup-identities/**
  - apps/platform/src/server/signup-block/**
  - apps/platform/src/server/tenants/block-tenant-owner-email.ts
  - apps/platform/src/server/create-site-gate/admit-create-site.ts
  - apps/platform/src/app/**/blocked-signups/*.tsx
  - apps/platform/src/components/features/blocked-signups/**
epics: [4840, 4979, 5649]
---

# Tenant access

## What it does

The admin decides who may run which tenant. Platform operators hold an `admins` row and reach every tenant. Tenant owners hold a `memberships` row and reach only their own sites. An owner who has never signed in has a pending `membership_invites` row instead. Their first sign-in turns that invite into a real membership. A denied request 404s, so it looks the same as a page that does not exist.

## Surfaces and routes

- **Operator tree.** `/tenants`, `/tenants/new` and `/findings` sit in the `(operator)` group, which requires any `admins` row. `/tenants/{id}/*` also needs any admin, and resolves archived tenants too. `/tenants/{id}/danger` additionally requires SUPERADMIN.
- **Owner tree.** `/dashboard/*` resolves the tenant from the session's own memberships:
  - with one membership, it uses that tenant;
  - with several, it reads the `admin-active-tenant` cookie, and without the cookie it redirects to `/dashboard/select-tenant`;
  - with none, it redirects to `/workspace-pending`.
    This tree hides the Platform nav, so an owner never sees that the platform has other tenants.
- **Tenant switching.** `GET /api/dashboard/select-tenant?tenantId=` sets the active-tenant cookie (httpOnly, 30 days) after checking access, and 404s otherwise. The tenant switcher in the shell only appears for users with more than one tenant.
- **Signup blocklist.** `/blocked-signups` in the `(operator)` group lists every blocked identity: its kind, the domain or the first characters of an address hash, the reason, who added it and when. A SUPERADMIN can add a domain there and remove any entry. The Suspend dialog on a tenant can also block that tenant's owner email, with a reason. The nav entry shows for SUPERADMINs only, and owners never see the list.
- **Home link.** The home link from a dead end goes to `/tenants` for an admin, `/dashboard` for any other signed-in user, and sign-in otherwise.

## Data

- **`admins`:** one row per user (`userId` is unique). It records:
  - `role`: SUPERADMIN, ADMIN or MODERATOR;
  - `grantedVia`: BREAK_GLASS or PROMOTION;
  - `grantedBy` and `grantedAt`.
    It has no `tenantId`.
- **`memberships`:** unique on `(userId, tenantId)`. `role` is OWNER, EDITOR or READER.
- **`membership_invites`:** unique on `(tenantId, email)`, with `role` and `consumedAt`. Its `email` also has an encrypted form and a keyed index.
- **Personal data reads.** `getTenantOwnerMembership` returns the OWNER's user email, else the pending OWNER invite's email, which it reads from the invite's encrypted column and decrypts, never from the plain one. User emails (the joined owner, the SUPERADMIN alert recipients, the Create site owner lookup) are still read from the plain `users.email` until sign-in writes their encrypted and index forms.
- **Cascades:** `admins` and `memberships` cascade on user delete. Memberships and invites cascade on tenant delete. An invite has no user until it is consumed.
- **`blocked_signup_identities`:** unique on `(kind, value)`. An ADDRESS entry stores only the keyed personal-data index (`PERSONAL_DATA_INDEX_KEY`) of the normalised address (lower-cased, `+tag` dropped), never the address. A DOMAIN entry stores the lower-cased domain. Each entry records `reason`, `createdByAdminId` and `createdAt`. Adds and removes are audited as `SIGNUP_BLOCK_ADDED` / `SIGNUP_BLOCK_REMOVED` against `BLOCKED_SIGNUP_IDENTITY`; re-adding an entry already on the list keeps its reason and author and records no second `SIGNUP_BLOCK_ADDED`. An address entry's audit row carries its kind and reason, never the address or hash. "Added by" on the list page is the email of the admin in `createdByAdminId`, read in the same query as the entries, and "Unknown" once that admin is gone.
- **Caching:** none. Every gate reads Neon per request, and `cache()` deduplicates the reads within one request.

## Configuration

- **Operators** are granted only by the manual `db:seed-admin` CLI. It writes BREAK_GLASS, never changes the role on an existing row, and requires the user to have signed in once first. The admin has no screen for granting operators.
- **Owners** are set when an operator creates the tenant ([tenant provisioning](./tenant-provisioning.md)):
  - a known user gets an OWNER membership;
  - an unknown email gets an OWNER invite and a `TENANT_INVITE` magic-link email.
    The owner email can be changed only while that invite is unaccepted.
- **Plan gating.** A plan-gated owner page 404s when the tenant's plan lacks it ([plans and entitlements](./plans-and-entitlements.md)).

## Constraints and invariants

- **Each gate is the layout of its tree**, never a check inside a page, except `/danger`, whose page calls `requireSuperAdmin`.
  - `requireAdmin` guards `(operator)`.
  - `requireTenantById` guards `/tenants/{id}`.
  - `listSessionTenants` and `resolveDashboardTenant` guard `/dashboard`.
- **Server Actions call a gate themselves.**
  - Tenant-scoped actions (Look, Voice, Features, Languages, Email, brand assets) call `requireTenantMembership`. That gate excludes archived tenants.
  - Creating a tenant and editing its details need `requireAdmin`.
  - Deprovision, reactivate, delete, the deprovisioning status poll and the blocklist add and remove actions need `requireSuperAdmin`.
  - The provisioning status poll needs the tenant's own OWNER or any admin; retry, Check now and Resend invite need the tenant's own OWNER or a SUPERADMIN (`requireTenantOwnerOrAdmin`).
- **Roles differ in three places only.**
  - Admin roles gate identically, except that SUPERADMIN alone passes `requireSuperAdmin` and alone sees every tenant under `/dashboard`.
  - Only SUPERADMINs receive operator alerts.
  - Membership roles never gate anything: only OWNER is ever written, and nothing reads EDITOR or READER.
- **Admins get a virtual OWNER membership.** Any `admins` row passes `requireTenantMembership` on any tenant through a virtual membership. Its id starts with `admin-virtual:`, so it can never pass as a foreign key. Call `isVirtualAdminMembership` before showing `membership.role`; the role chip shows the admin role instead.
- **Invite consumption is atomic.** The claim stamps `consumedAt` only if it is still null. A failed membership insert resets it, and an existing membership is returned as-is.
- **Invites are consumed best-effort, in the admin only.** `@blog/auth`'s `events.signIn` consumes invites on sign-in to the admin; signing in as a reader on a site leaves them pending. A failure is swallowed and retried on the next admin sign-in.
- **The blocklist is checked live.** Create site refuses a blocked address or domain with its neutral reply, even for a user who already holds a session, and enqueues nothing ([platform sign-in and onboarding](./platform-sign-in-and-onboarding.md)). Removing an entry restores sign-up at once. Blocking while suspending saves the block, then suspends. `neon-http` has no transactions, so a refused or failed suspension removes the block again, but only one this request created; an older entry stays. A failed removal is logged, and the operator still sees the suspension fail. `SIGNUP_BLOCK_ADDED` is recorded only once the suspension is saved. A failed block, or an owner with no email on record, leaves the tenant unsuspended.
- **Platform access is not Studio access.** Studio rights come from the tenant's Sanity project ACL. The owner is invited as `viewer` and raised to `administrator` by owner elevation ([embedded studio](./embedded-studio.md)).
- **Site sign-in is separate.** A public site's readers sign in through the same `users` table, but `memberships` never gate anything in `apps/web` ([reader auth](./reader-auth.md)).

## Dependencies

- **Layers:**
  - `@blog/db` holds the tables and queries.
  - `@blog/auth` consumes invites on sign-in and chooses the invite template.
  - `@blog/email` renders the invite email.
  - `apps/platform` owns the gates and the cookie.
- **Features:** [platform sign-in and onboarding](./platform-sign-in-and-onboarding.md), [platform shell](./platform-shell.md), [tenant provisioning](./tenant-provisioning.md), [embedded studio](./embedded-studio.md), [email](./email.md), [multi-tenancy](./multi-tenancy.md).
- **Env:** `AUTH_SECRET` (session and the owner-invite confirmation HMAC), `DATABASE_URL`.

## Entry points

- `apps/platform/src/server/auth/require-admin.ts`
- `apps/platform/src/server/auth/require-super-admin.ts`
- `apps/platform/src/server/auth/require-tenant-by-id.ts`
- `apps/platform/src/server/auth/require-tenant-membership.ts`
- `apps/platform/src/server/auth/list-session-tenants.ts`
- `apps/platform/src/server/auth/resolve-dashboard-tenant.ts`
- `apps/platform/src/app/api/dashboard/select-tenant/route.ts`
- `packages/auth/src/events/consume-pending-invites-on-sign-in.ts`
- `packages/db/src/queries/membership-invites/consume-membership-invite/consume-membership-invite.ts`

## Tests and stories

- `apps/platform/src/server/auth/*.test.ts`, with `__mocks__/require-tenant-membership.ts`.
- `apps/platform/src/app/api/dashboard/select-tenant/route.test.ts`.
- The `dashboard/select-tenant` page test and `tenant-switcher.test.tsx`.
- `packages/auth/src/events/consume-pending-invites-on-sign-in.test.ts`.
- `apps/platform/src/server/signup-block/*.test.ts`, `admit-create-site.test.ts`, the `blocked-signups` layout and page tests, `blocked-signups-view.test.tsx` and `tenant-suspension-control.test.tsx`.
- `packages/db/src/queries/{memberships,membership-invites,admins}/**` tests (PGlite), plus `schema/admins-granted-via-migration.test.ts`.
- No Storybook.

## Related

- 4840: platform front door epic. It adds self-serve signup creating an OWNER membership, and owner Studio access states.
- 4960: shared `/sign-in`, `/signup`, `/onboarding` and self-serve tenant creation.
- 4955: owner Studio access through invite tracking, acceptance polling and grant.
- 4959: owner provisioning status and Studio access states.
- 4979: web and platform stay separate (sessions, language).
- 4982: the admin refuses sessions it did not issue.
- 4983: public sites never act on platform invites.
- 4986: manual test that the admin and public sites sign in separately.
