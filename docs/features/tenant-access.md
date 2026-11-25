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
  - packages/db/src/queries/admin-invites/**
  - packages/db/src/schema/admin-invites.ts
  - packages/db/src/utils/studio-access/**
  - packages/db/scripts/seed-admin.ts
  - packages/auth/src/events/**
  - packages/auth/src/providers/magic-link/find-pending-invite-tenants/**
  - apps/platform/src/server/auth/require-*.ts
  - apps/platform/src/server/auth/is-super-admin*.ts
  - apps/platform/src/server/auth/build-virtual-admin-membership*.ts
  - apps/platform/src/server/auth/list-session-tenants*.ts
  - apps/platform/src/server/auth/resolve-*.ts
  - apps/platform/src/app/api/dashboard/select-tenant/**
  - apps/platform/src/app/api/admin-invite/**
  - apps/platform/src/app/[locale]/no-access/**
  - apps/platform/src/constants/no-access.ts
  - apps/platform/src/constants/select-tenant.ts
  - apps/platform/src/utils/sign-in-redirect/**
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
  - apps/platform/src/server/team/**
  - apps/platform/src/app/**/team/*.tsx
  - apps/platform/src/components/features/team/**
  - apps/platform/src/utils/team-view-model/**
  - apps/platform/src/utils/use-row-action/**
  - apps/platform/src/utils/refused-action/**
  - apps/platform/src/server/platform-admins/**
  - apps/platform/src/app/**/admins/*.tsx
  - apps/platform/src/components/features/platform-admins/**
  - apps/platform/src/constants/platform-admins.ts
  - apps/platform/src/utils/use-team-table-columns/**
  - apps/platform/src/constants/team-access.ts
epics: [4840, 4979, 5649]
---

# Tenant access

## What it does

The platform decides who may run which tenant. Platform operators hold an `admins` row and reach every tenant. Tenant owners hold a `memberships` row and reach only their own sites. An owner who has never signed in has a pending `membership_invites` row instead. Their first sign-in turns that invite into a real membership. A denied request 404s, so it looks the same as a page that does not exist.

## Surfaces and routes

- **Operator tree.** `/tenants`, `/tenants/new` and `/findings` sit in the `(operator)` group, which requires any `admins` row. `/tenants/{id}/*` also needs any admin, and resolves archived tenants too. `/tenants/{id}/danger` additionally requires SUPERADMIN.
- **Owner tree.** `/dashboard/*` resolves the tenant from the session's own memberships:
  - with one membership, it uses that tenant;
  - with several, it reads the `platform-active-tenant` cookie, and without the cookie it redirects to `/dashboard/select-tenant`;
  - with none, it redirects to `/onboarding`.
    This tree hides the Platform nav, so an owner never sees that the platform has other tenants.
- **Tenant switching.** `GET /api/dashboard/select-tenant?tenantId=` sets the active-tenant cookie (httpOnly, 30 days) after checking access. Without access — no membership, and not a SUPERADMIN on a tenant that exists — it sets no cookie and redirects to `/no-access`, a plain dead-end page with a way home: "You don't have access to this site. Ask the site owner." An owner or team invite's link adds `from=INVITE` (`dashboardSelectTenantFromInviteHref`), so an invite that was cancelled or could not be consumed reads "This invite can't be used right now. Ask the site owner." instead. Neither mentions seats. The tenant switcher in the shell only appears for users with more than one tenant.
- **Signup blocklist.** `/blocked-signups` in the `(operator)` group lists every blocked identity: its kind, the domain or the first characters of an address hash, the reason, who added it and when. A SUPERADMIN can add a domain there and remove any entry. The Suspend dialog on a tenant can also block that tenant's owner email, with a reason. The nav entry shows for SUPERADMINs only, and owners never see the list.
- **Admins page.** `/admins` in the `(operator)` group lists every admin (name, email, role, granted date) and every admin invite (email, role, invited date, Pending or Expired). A SUPERADMIN invites an address as Admin or Super admin there; Moderator is not offered, and an action called with it is refused. Each invite row can be resent, which sends the email again and restarts its 7 days, or cancelled. Every admin row but the viewer's own offers Remove, which takes access away on the next request and deletes every session the removed user holds, signing them out of the platform and any site dashboard; removing the last SUPERADMIN is refused. A failed session delete is logged as `platform_admin.remove_sessions_failed`, and the removal still succeeds. The nav entry shows for SUPERADMINs only. The invite email's link lands on `GET /api/admin-invite`, which sends an admin on to `/tenants` and anyone else — a cancelled or expired invite — to `/no-access`: "This invite is no longer valid. Ask the person who invited you." `/tenants` itself still 404s a non-admin.
- **Home link.** The home link from a dead end goes to `/tenants` for an admin, `/dashboard` for any other signed-in user, and sign-in otherwise.

## Data

- **`admins`:** one row per user (`userId` is unique). It records:
  - `role`: SUPERADMIN, ADMIN or MODERATOR;
  - `grantedVia`: BREAK_GLASS, PROMOTION or INVITE;
  - `grantedBy` and `grantedAt`.
    It has no `tenantId`.
- **`admin_invites`:** one invite per exact address (`email_exact_index`), the address stored only encrypted, with `role`, `invitedBy` and `expiresAt`, 7 days after it was created (`ADMIN_INVITE_LIFETIME_DAYS`). Inviting an address again replaces the role and restarts the 7 days; inviting a current admin is refused. `listAdminInvites` returns expired invites too, and an expired invite is never consumed. Signing in from an address with an unexpired invite creates its `admins` row (`grantedVia` INVITE, `grantedBy` the inviter) and removes the invite in one statement; an address that is already an admin just loses the invite.
- **`memberships`:** unique on `(userId, tenantId)`. `role` is OWNER, EDITOR or READER. Each membership also carries its own Studio access record, mirroring the owner's on `tenants`: the Sanity invite id, when that invite was sent and accepted, the Sanity user id and the login provider. The worker reads and writes it through `getMemberStudioAccess` and `setMemberStudioAccess`, both scoped to the tenant; clearing it is `setMemberStudioAccess` with every field `null`. `getMemberStudioIdentity` reads one membership's decrypted email and Sanity user id, locked or not, so a removed member's access can be revoked after the row is gone. `getMemberStudioAccess` does not find a locked membership; `setMemberStudioAccess` still records against one, so the record matches what Sanity did when a seat downgrade locks the member mid-run. `setMemberStudioAccess` is last-write-wins, and returns `DB_NOT_FOUND` once the membership has been removed.
- **`membership_invites`:** the address is stored only encrypted, with a keyed index that drops `+tag`s so a data request reaches every variant, and `email_exact_index`, which keeps them. Unique on `(tenantId, email_exact_index)`, with `role` and `consumedAt`; an invite written before that column existed has none and is not covered by the rule. At sign-in, `findPendingInviteByEmail` looks invites up by the `+tag`-blind index and keeps only the ones whose decrypted email is the exact requested address, ignoring case. Changing a pending owner's email is refused when another invite on the tenant holds the new address's exact index.
- **Team reads and writes.**
  - `listTenantMembers` returns only that tenant's members, owners first, each with the decrypted email, role, whether they have signed in, when they joined, when they were locked (absent when unlocked) and their Studio access state. The state is derived the way the owner's is (Invite sent, Activating, Ready, Stalled after `OWNER_ACCESS_STALL_AFTER_MS`), by the shared `studioAccessOf`, and is absent until a Studio invite has been sent.
  - `listPendingMembershipInvites` returns only that tenant's unconsumed invites, with the decrypted email, role and invite date.
  - `removeMembership` refuses to remove the acting user (`SELF`) and the tenant's last owner (`LAST_OWNER`), and changes nothing when it refuses. A removal also deletes that person's consumed invite on the tenant in the same statement, so the same address can be invited again. An id that is not a UUID, such as an operator's virtual membership, is not found; `cancelMembershipInvite` returns false for one. Concurrent removals of two different owners are not serialised: each sees the other still present.
  - `cancelMembershipInvite` deletes one pending invite of that tenant. It never cancels a pending OWNER invite, which is the site's only owner until it is accepted and moves with the owner email instead.
  - `listMembersPendingStudioAccess` returns each unlocked EDITOR, on a writable tenant whose provisioning is READY, whose Studio access is not yet READY, for the hourly owner-access sweep. The owner is left to the owner flow, which keeps its state on `tenants`.
  - `listLockedMembersWithStudioAccess` returns each locked membership, on a writable tenant whose provisioning is READY, with any Studio access recorded, with its tenant, email, Sanity user id and recorded Sanity invite id. The worker's hourly owner-access sweep revokes each one ([tenant provisioning](./tenant-provisioning.md)), so a member locked by a downgrade or at sign-in loses Sanity administrator and any pending Studio invite within the hour.
  - Changing a role has no query yet.
- **Team actions** (`apps/platform/src/server/team/`). Invite, remove and cancel are gated by `requireTenantManager` (the tenant's OWNER or any operator); Check now and Resend invite by `requireTenantOwnerOrAdmin` with SUPERADMIN only.
  - **Invite** trims and lower-cases the address and refuses a malformed one, a current member's (the owner's included) and, through `createMembershipInvite` with role EDITOR, an accepted invite's, a pending invite's or one past the seat limit — each as its own field error naming the address, with no email sent. On `CREATED` it sends the Auth.js magic link through `sendOwnerInviteEmail`, which reports whether the email went out; when it did not, the failure is logged once as `team_access.invite_email_failed` and the invite is cancelled, so the next try creates and sends a fresh one.
  - **Remove** reads the member's role, email and Sanity user id, then calls `removeMembership`; `SELF`, `LAST_OWNER` and not found come back as refusals and change nothing. Removing an EDITOR then asks the worker's `POST /api/member-access/revoke` to revoke their Studio access after the response: up to three attempts, 1s then 3s apart, stopping early on a 4xx the worker will never accept, and logging `team_access.revoke_failed` once at the end with the last status or transport failure, while the removal stands. A READER has no Studio access and an OWNER no member-level record, so neither is revoked; an editor with no readable address cannot be revoked by address, so the removal logs `team_access.revoke_skipped_no_email` instead.
  - **Cancel** refuses a pending OWNER invite and answers not found for an invite no longer pending.
  - **Check now and Resend invite** for a member reach `/api/member-access/check` and `/resend` through `enqueueOwnerAccessRequest` with the membership id; any membership that is not an unlocked EDITOR 404s, like a denied gate. A refused member request logs `team_access.access_request_failed`.
  - Invite, remove and cancel record `MEMBER_INVITED`, `MEMBER_REMOVED` and `MEMBER_INVITE_CANCELLED` against `TEAM_MEMBER` (the invite or membership id), with only the role in the details, never an address.
- **Team page** (`/dashboard/team` for the owner, `/tenants/{id}/team` for an operator). The owner reaches it on a plan with more than one seat, and on any plan while the site's seats in use (`countSeatsInUse`) exceed its `seats`, as after a move to a plan with fewer seats; an editor or reader never sees it in the sidebar and gets a 404, and so does an owner on Free or Starter within its seats. `resolveTenantPageAccess` closes `team` to anyone who cannot manage the tenant, and reads the seat count only when the plan does not already open Team. Operators reach it on every plan, from an Account section after Configuration; the owner's sidebar lists it in Account, before Billing.
  - The header reads "{used} of {seats} seats used": `used` counts every membership (locked ones included) and every pending invite (a pending OWNER invite included), as the seat limit does, and is shown capped at the plan's seats, except over the seats, where the header shows the real count of people who hold a seat (unlocked members plus pending invites). Once full, Invite editor is held and an information notice (not a warning) under the header says why. Over the seats, Invite editor is not shown at all, so Remove and Cancel invite are the only ways to change the team, and the warning says how many people must go to fit the plan, counting unlocked members and pending invites, so members the day-14 lock already locked do not count; during a downgrade grace it adds the date (`graceEndDate`) on which members still over the seats lock and the invites that don't fit are stopped.
  - Members lists owners first, then members by when they joined. The owner's row reads its Studio state from the tenant's owner access flow (`tenantOwnerStudioAccess`), whoever is viewing; a member's from its own record, and "Setting up…" until the worker's first invite. A locked member reads Locked, a reader "No Studio access". Check now and Resend invite show to the owner and a SUPERADMIN only, on rows with an address and a pending state, and their toasts name the address. Your own row and the last owner's offer no Remove, and an operator sees no "(you)".
  - With no editor, a note gives the free seats; an operator on a tenant whose owner hasn't joined sees "No one has joined this site yet." Pending invites lists every invite but a pending OWNER one, oldest first.
  - Invite, Remove and Cancel invite run the Team actions below. Removing a member or cancelling an invite that is already gone closes the confirmation, says so and refreshes; any other refusal or failure shows inside the dialog. Below `md` both tables stack, the role moving onto the person's second line.
- **Personal data reads.** `getTenantOwnerMembership` returns the OWNER's user email and whether they have signed in, else the pending OWNER invite's email. The SUPERADMIN alert recipients and the blocklist's "added by" are user emails too. Every one of these reads the encrypted column and decrypts it. Create site finds an existing owner with `findUserByEmail`, the same exact-address index lookup sign-in uses.
- **Cascades:** `admins` and `memberships` cascade on user delete. Memberships and invites cascade on tenant delete. An invite has no user until it is consumed.
- **`blocked_signup_identities`:** unique on `(kind, value)`. An ADDRESS entry stores only the keyed personal-data index (`PERSONAL_DATA_INDEX_KEY`) of the normalised address (lower-cased, `+tag` dropped), never the address. A DOMAIN entry stores the lower-cased domain. Each entry records `reason`, `createdByAdminId` and `createdAt`. Adds and removes are audited as `SIGNUP_BLOCK_ADDED` / `SIGNUP_BLOCK_REMOVED` against `BLOCKED_SIGNUP_IDENTITY`; re-adding an entry already on the list keeps its reason and author and records no second `SIGNUP_BLOCK_ADDED`. An address entry's audit row carries its kind and reason, never the address or hash. "Added by" on the list page is the email of the admin in `createdByAdminId`, read in the same query as the entries, and "Unknown" once that admin is gone.
- **Audit.** Inviting, removing and cancelling are recorded as `MEMBER_INVITED`, `MEMBER_REMOVED` and `MEMBER_INVITE_CANCELLED` against `TEAM_MEMBER`. An email address is never written to these events' details.
- **Caching:** none. Every gate reads Neon per request, and `cache()` deduplicates the reads within one request.

## Configuration

- **Operators** are granted only by the manual `db:seed-admin` CLI. It writes BREAK_GLASS, never changes the role on an existing row, and requires the user to have signed in once first. Further operators are invited from the Admins page.
- **Owners** are set when an operator creates the tenant ([tenant provisioning](./tenant-provisioning.md)):
  - a known user gets an OWNER membership;
  - an unknown email gets an OWNER invite and a `TENANT_INVITE` magic-link email, whose link signs the owner in, selects that tenant and lands on `/dashboard`, never the operator's `/tenants/<id>` page, whichever page the operator sent it from.
    The owner email can be changed, even after provisioning, until the owner has signed in. "Signed in" means the owner's user has `emailVerified` set (a magic-link sign-in) or a linked OAuth account; one helper, `userHasSignedIn`, decides it for the field lock, `updateTenantDetails` and the Owner card. A change moves the pending invite to the new address, or swaps a never-signed-in owner's membership for an invite, deletes the old address's unused sign-in links, and sends a fresh invite to the new address. Once the tenant has a Sanity project, it also asks the worker to re-send the Sanity project invite, which first revokes the old address's Studio invite and project roles ([tenant provisioning](./tenant-provisioning.md)). The request carries the former owner email, and the worker also finds the old address from the invite or Sanity user it recorded, so an old owner who accepted the invite before a check recorded them also loses their role. If that request fails, the change still saves, and the former email is kept encrypted in `tenants.unsent_reinvite_former_owner_email_encrypted` (no plain copy, no lookup index). The operator gets a warning toast saying the Studio invite was not sent, with a Resend invite action that any admin can use. While the re-invite is owed, the tenant page's details card also shows a persistent warning that the new owner's Studio invite hasn't been sent, with the same Resend invite action; a successful resend refreshes the page and the warning goes, while a failed one shows an error and leaves it. The browser only learns that the invite was not sent: the resend reads the former email server-side, sends it with the request and clears it once the worker accepts. A later owner-email change also clears it, and a [data request](./data-requests.md) finds and erases it. The audit event's `studioReinviteRequested` records whether the request was accepted. The Owner card shows `Invited <date>, not signed in yet` until then, and `Joined <date>` afterwards.
- **Plan gating.** A plan-gated owner page 404s when the tenant's plan lacks it ([plans and entitlements](./plans-and-entitlements.md)).

## Constraints and invariants

- **Each tree's layout gates it, and every `(operator)` page calls its gate again**: client-side navigation keeps a layout without re-running it, so a page relying on the layout alone would still load for a removed admin. `/danger` calls `requireSuperAdmin` on top of its tree's gate.
  - `requireAdmin` guards `(operator)`; each of its pages calls `requireAdmin` or `requireSuperAdmin` itself, and `pages.test.ts` beside the layout fails for any page that skips its own check.
  - `requireTenantById` guards `/tenants/{id}`.
  - `listSessionTenants` and `resolveDashboardTenant` guard `/dashboard`.
- **Server Actions call a gate themselves.**
  - Every tenant-scoped settings save (Look, Voice, Features and its analytics id, Languages, Email settings, templates, logo and test send, brand assets) calls `requireTenantManager`: the tenant's own OWNER or an operator. An editor keeps the Studio and cannot save any of them. Reads and the custom-domain status poll still call `requireTenantMembership`. Both gates exclude archived tenants.
  - Creating a tenant and editing its details need `requireAdmin`.
  - Deprovision, reactivate, delete, the deprovisioning status poll, the blocklist add and remove actions and the admin invite, resend, cancel and remove actions need `requireSuperAdmin`.
  - Inviting, cancelling an invite and removing an admin are audited as `ADMIN_INVITED`, `ADMIN_INVITE_CANCELLED` and `ADMIN_REMOVED` against `PLATFORM_ADMIN`, with the role and never the address; a removal also records the removed user's id. An invite whose email fails to send is cancelled and records nothing.
  - The provisioning status poll needs the tenant's own OWNER or any admin; retry, Check now and Resend invite need the tenant's own OWNER or a SUPERADMIN (`requireTenantOwnerOrAdmin`).
- **Roles differ in three places only.**
  - Admin roles gate identically, except that SUPERADMIN alone passes `requireSuperAdmin` and alone sees every tenant under `/dashboard`.
  - Only SUPERADMINs receive operator alerts.
  - Membership roles gate the settings saves: OWNER passes `requireTenantManager`, EDITOR and READER do not.
- **Admins get a virtual OWNER membership.** Any `admins` row passes `requireTenantMembership` on any tenant through a virtual membership. Its id starts with `admin-virtual:`, so it can never pass as a foreign key. Call `isVirtualAdminMembership` before showing `membership.role`; the role chip shows the admin role instead.
- **Invite consumption is atomic.** The claim stamps `consumedAt` only if it is still null. A failed membership insert resets it, and an existing membership is returned as-is.
- **Invites are consumed best-effort, in the platform only.** `@shinefold/auth`'s `events.signIn` consumes invites on sign-in to the platform; signing in as a reader on a site leaves them pending. A failure is swallowed and retried on the next platform sign-in.
- **The blocklist is checked live.** Create site refuses a blocked address or domain with its neutral reply, even for a user who already holds a session, and enqueues nothing ([platform sign-in and onboarding](./platform-sign-in-and-onboarding.md)). Removing an entry restores sign-up at once. Blocking while suspending saves the block, then suspends. `neon-http` has no transactions, so a refused or failed suspension removes the block again, but only one this request created; an older entry stays. A failed removal is logged, and the operator still sees the suspension fail. `SIGNUP_BLOCK_ADDED` is recorded only once the suspension is saved. A failed block, or an owner with no email on record, leaves the tenant unsuspended.
- **Platform access is not Studio access.** Studio rights come from the tenant's Sanity project ACL. The owner is invited as `viewer` and raised to `administrator` by owner elevation ([embedded studio](./embedded-studio.md)). The worker sends that invite and removes the `viewer` role with the tenant's own Sanity management token, so both survive rotation of the organisation token. Granting `administrator`, and removing it from a former owner, stay on the organisation token, because Sanity refuses a project-scoped token any change to an `administrator` role: after a rotation, the owner of a tenant created before it is promoted by hand in Sanity Manage. Owner discovery — listing the organisation's users while the owner is not yet a project member, the usual case before their first Studio sign-in — uses the organisation token. A replacement organisation token keeps that lookup working only if it can read the organisation's members ([tenant provisioning](./tenant-provisioning.md)). An EDITOR gets the same access through the same flow, per membership: invited as `viewer`, raised to `administrator` (Sanity's Free plan has no editor role), and recorded on their membership; removing them deletes their pending invite and revokes every role they hold, through the worker's `POST /api/member-access/revoke`, which takes the removed address because the row is already gone ([tenant provisioning](./tenant-provisioning.md)).
- **Site sign-in is separate.** A public site's readers sign in through the same `users` table, but `memberships` never gate anything in `apps/web` ([reader auth](./reader-auth.md)).

## Dependencies

- **Layers:**
  - `@shinefold/db` holds the tables and queries.
  - `@shinefold/auth` consumes invites on sign-in and chooses the invite template.
  - `@shinefold/email` renders the invite email.
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
- `apps/platform/src/app/api/dashboard/select-tenant/route.test.ts`, `app/api/admin-invite/route.test.ts` and the `no-access` page test.
- The `dashboard/select-tenant` page test and `tenant-switcher.test.tsx`.
- `packages/auth/src/events/consume-pending-invites-on-sign-in.test.ts`.
- `apps/platform/src/server/team/*.test.ts`, `team-view-model.test.ts`, the `components/features/team/` tests and the dashboard Team page test, with builders in `apps/platform/src/testing/team/fixtures.ts`.
- `apps/platform/src/server/signup-block/*.test.ts`, `admit-create-site.test.ts`, the `blocked-signups` layout and page tests, `blocked-signups-view.test.tsx` and `tenant-suspension-control.test.tsx`.
- `packages/db/src/queries/{memberships,membership-invites,admins}/**` tests (PGlite), and `packages/db/src/utils/studio-access/studio-access.test.ts`.
- No Storybook.

## Related

- 4840: platform front door epic. It adds self-serve signup creating an OWNER membership, and owner Studio access states.
- 4960: shared `/sign-in`, `/signup`, `/onboarding` and self-serve tenant creation.
- 4955: owner Studio access through invite tracking, acceptance polling and grant.
- 4959: owner provisioning status and Studio access states.
- 7608: the Team page's invite, remove, cancel, check and resend actions.
- 7168: a team member gets Studio access through the owner's flow and loses it on removal.
- 7169: the Team page.
- 4979: web and platform stay separate (sessions, language).
- 4982: the platform refuses sessions it did not issue.
- 4983: public sites never act on platform invites.
- 4986: manual test that the platform and public sites sign in separately.
