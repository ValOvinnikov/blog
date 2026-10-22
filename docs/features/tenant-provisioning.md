---
title: Tenant provisioning
status: built
layers: [db, platform, web, worker, config, studio]
code:
  - apps/worker/src/steps/**
  - apps/worker/src/cli/**
  - packages/config/src/starter-content/**
  - packages/db/scripts/deprovision-tenant/**
  - packages/db/scripts/invalidate-tenant-cache/**
  - packages/db/scripts/recheck-tenant-owners/**
  - packages/db/scripts/recover-wedged-provisioning*.ts
  - packages/db/scripts/seed-tenant*.ts
  - packages/db/scripts/lib/workflow-run-url/**
  - packages/db/src/constants/tenant-*provisioning*.ts
  - packages/db/src/queries/tenants/*provisioning*/**
  - packages/db/src/queries/tenants/create-tenant-draft/**
  - packages/db/src/queries/tenants/archive-tenant/**
  - packages/db/src/queries/tenants/reactivate-tenant/**
  - packages/db/src/queries/tenants/delete-tenant/**
  - packages/db/src/queries/tenants/update-tenant-details/**
  - packages/db/src/queries/tenants/set-tenant-sanity-*/**
  - packages/db/src/queries/tenants/set-tenant-webhook-created-at/**
  - packages/db/src/queries/tenants/list-tenants-pending-owner-elevation/**
  - apps/worker/**
  - apps/platform/src/server/provisioning/**
  - apps/platform/src/server/tenants/create-tenant-action*.ts
  - apps/platform/src/server/tenants/update-tenant-details-action*.ts
  - apps/platform/src/server/tenants/owner-invite-token*.ts
  - apps/platform/src/components/features/tenants/*provisioning*/**
  - apps/platform/src/components/features/tenants/*-tenant-control/**
  - apps/platform/src/components/features/tenants/run-*/**
  - apps/platform/src/components/features/tenants/*domain*/**
  - apps/platform/src/components/features/tenants/add-tenant-wizard/**
  - apps/platform/src/components/features/tenants/tenant-danger-page-content/**
  - apps/platform/src/components/features/tenants/tenant-details-*/**
  - apps/platform/src/utils/use-*provisioning-poll/**
  - apps/platform/src/utils/run-steps/**
  - apps/platform/src/utils/provisioning-view-state/**
  - apps/platform/src/utils/use-staged-step-statuses/**
  - apps/platform/src/utils/tenant-field-locks/**
  - apps/platform/src/app/**/provisioning/*.tsx
  - apps/platform/src/app/**/danger/*.tsx
  - apps/platform/src/app/**/tenants/new/*.tsx
  - .github/workflows/deprovision-tenant.yml
  - .github/workflows/invalidate-tenant-cache.yml
  - .github/workflows/recheck-tenant-owners.yml
epics: [4840, 2798]
---

# Tenant provisioning

## What it does

An operator creates a tenant in the admin. That inserts a draft row and enqueues a provisioning run on `apps/worker`, which gives the tenant everything it needs:

- its own Sanity project and dataset;
- starter content;
- read and write tokens;
- a domain on the shared web Vercel project;
- a revalidation webhook.

The run then verifies all of it. The admin polls each step's progress and offers Retry. Deprovisioning reverses the run: it archives the tenant, never hard-deletes it. Reactivation re-runs provisioning. Deletion is a separate, final hard delete of an archived tenant.

## Surfaces and routes

- **Operator pages (any `admins` row):**
  - `/tenants` lists tenants, with an archived toggle.
  - `/tenants/new` is the add-tenant wizard.
  - `/tenants/{id}` shows an overview with a provisioning banner.
  - `/tenants/{id}/provisioning` shows each step's status and the run. Until the workflow starts the run, it says the run is queued and counts the wait. A step that finishes between two polls is still shown Running before it settles.
  - `/tenants/{id}/domain` shows DNS records and live Vercel verification.
- **SUPERADMIN only:** `/tenants/{id}/danger` holds deprovision (with dry run), reactivate and delete.
- **Owner:** `/dashboard` shows a setup progress card, with Retry on a failure, until provisioning is READY. `/dashboard/domain` shows the same domain view.
- **Workflows:**
  - `deprovision-tenant.yml` and `invalidate-tenant-cache.yml` are dispatch only. No workflow provisions a tenant.
  - `recheck-tenant-owners.yml` and `validate-tenant-documents.yml` are dispatch only while their crons are parked.
- **Worker:** `apps/worker` (`worker-dev`/`worker-prod`, no public hostname) serves `POST /api/provision`, body `{ "tenantId": "<uuid>" }`. It is signed with `x-worker-timestamp` (epoch milliseconds, within 5 minutes of the worker's clock) and `x-worker-signature` (`sha256=` plus the hex HMAC-SHA256 of `<timestamp>.<request path>.<raw body>`, keyed with `WORKER_ENQUEUE_SECRET`). It answers 202 with the run id, 401, 400, 404, or 409 when a run is already in progress. `POST /api/owner-access/check` ("Check now") and `POST /api/owner-access/resend` take the same signed body and answer 202, 401, 400, 404, or 409 `NOT_PROVISIONED` while the tenant has no Sanity project. The admin panel's "Add tenant", retry and reactivate call `POST /api/provision`; the owner's Studio explainer calls the owner-access routes.
- **Manual CLIs:** `db:seed-tenant` and `db:recover-wedged-provisioning`.
- **Break-glass CLI:** `pnpm --filter worker provision-tenant -- --tenant-id=<uuid>`, run with the worker's env, provisions one tenant when the worker deployment cannot. It runs the same units in the same order behind the same `beginTenantProvisioning` guard, but once: no durable retries, so a unit's first failure marks its step FAILED. It never starts owner access and logs `provisioning.cli_owner_access_not_started`; a signed `POST /api/owner-access/check` starts it. Its run id starts `cli-`.

## Data

- **Provisioning state on `tenants`:**
  - `provisioningStatus` is PENDING, PROVISIONING, READY or FAILED.
  - `provisioningSteps` is jsonb, one entry per step (IDLE / RUNNING / DONE / FAILED with error and `updatedAt`), plus a `run` entry: `startedAt`, `finishedAt`, `admittedAt`, `registry` and `workflowRunUrl`.
  - Artifacts: `sanityProjectId`, `sanityDataset`, both encrypted tokens, `seededAt` and `webhookCreatedAt`.
  - `lastNotifiedOwnerElevationOutcome` and `deprovisioningSteps` (same shape as `provisioningSteps`).
  - `siteType` (`SITE_TYPE`: BLOG, PORTFOLIO, PERSONAL, DOCS, BLANK, BUSINESS, PRODUCT; a `site_type` pgEnum, null for tenants created before signup) and `siteTemplateVersion`.
  - Owner Studio access: `ownerSanityInviteId`, `ownerInviteSentAt`, `ownerInviteAcceptedAt`, `ownerSanityUserId`, `ownerLoginProvider` (`SANITY_LOGIN_PROVIDER`), `ownerSanityRole` (`SANITY_PROJECT_ROLE`) and when each owner email went out (`ownerInviteHeadsUpSentAt`, `ownerInviteNudgeSentAt`, `ownerSiteReadySentAt`), read and written through `getTenantOwnerAccess` / `setTenantOwnerAccess`. The worker claims each sent-at atomically with `claimTenantOwnerEmail` (`TENANT_OWNER_EMAIL`) before sending, and `releaseTenantOwnerEmail` clears its own claim after a failed send.
  - Inactivity lifecycle: `lastActivityAt` (set at creation; rows that existed before the column took the migration's time), `inactivityWarnedAt`, `suspendedAt`, `deletionNotifiedAt` and `suspensionReason` (`SUSPENSION_REASON`: INACTIVITY or OPERATOR). `touchTenantActivity` moves `lastActivityAt` forward (never back) and clears the warning and deletion-notice stamps; it refuses an archived tenant. `listTenantsDueForInactivityStage(stage, now)` returns the tenants due at an `INACTIVITY_STAGE` — SUSPENSION_WARNING (day 23, ACTIVE, not yet warned), SUSPENSION (day 30, ACTIVE, warned), DELETION_NOTICE (day 50, SUSPENDED for INACTIVITY, not yet notified) and DEPROVISIONING (day 60, notified, no deprovisioning run started since the notice) — never an archived one. `stampTenantInactivityStage(tenantId, stage, now)` re-checks that the tenant is still due and stamps it in one conditional update, returning the row only to the caller that claimed it; SUSPENSION also sets `status` SUSPENDED and the reason INACTIVITY. The deprovisioning stage is claimed by `startDeprovisioningRun`. No sweep calls these yet.
  - `provisioningSteps` also accepts the `apps/worker` unit keys (`WORKER_PROVISIONING_STEP`: `ENSURE_INFRASTRUCTURE`, `INVITE_OWNER`, `APPLY_SITE_TEMPLATE`, `VERIFY_TENANT`, `ENSURE_OWNER_ACCESS`, `VALIDATE_DOCUMENTS`), present only once a worker run reports them.
- **Core steps, in order:**
  1. `SANITY_PROJECT` creates the project and dataset, adds a CORS entry for the admin origin, and invites the owner as `viewer`.
  2. `SEED_CONTENT` writes `settings_site`, `settings_navigation`, `settings_footer`, `page_home` with its `template_home`, and `page_postIndex` with its `template_postIndex`, built by `@blog/config`'s `buildStarterDocuments({ siteType, siteName, locale, publishedAt })` as the Blank site, in the tenant's default locale from the per-locale starter copy catalogue (`src/starter-content/copy/`). The builder also produces the Blog site, which the worker does not seed yet. Each document is typed against the generated Sanity types and created with `createIfNotExists` under a fixed id, so a re-run never overwrites an owner's edits. It runs only if `settings_site` is absent, using an `editor` token that is persisted on success and revoked on failure.
  3. `PERSIST_TOKEN` mints a `viewer` read token.
  4. `MAP_DOMAIN` adds `primaryDomain` to the shared web project.
  5. `CREATE_WEBHOOK` lists the project's webhooks and creates one only when none targets `${WEB_APP_URL}/api/revalidate`. It creates the hook on `api.sanity.io`'s hooks endpoint, triggered on create, update and delete with the `{_type, _id, "slug": slug.current}` projection, then re-lists and fails, naming the project, if the hook is not there. `webhookCreatedAt` is display-only and never skips the check, so a hook at an old URL, or one deleted in Sanity, is replaced on the next run.
  6. `VERIFY_CONTENT` re-checks the singletons, nav links, the home heading and SEO title, the webhook and the domain.
- **Owner elevation:** `OWNER_ELEVATION` runs after the core steps and never changes the overall status. It records one of `ELEVATED`, `ALREADY_ADMINISTRATOR`, `PENDING_ACCEPTANCE`, `STALLED` (after 3 days) or `AMBIGUOUS_MEMBERSHIP`.
- **Deprovisioning steps:** `REMOVE_DOMAIN`, `ARCHIVE_SANITY_PROJECT` (sets `isDisabledByUser`), `REVOKE_SANITY_TOKENS`, `CLEAR_ARTIFACTS`, `ARCHIVE_TENANT` (`status` ARCHIVED plus `deprovisionedAt`), `PURGE_READER_DATA` (`subscribers`, `bookmarks`, `membership_invites`) and `INVALIDATE_TENANT_CACHE` (POST to `/api/revalidate-site-config`).
- **Audit:** each lifecycle event writes an `audit_events` row: created, provisioned or failed, deprovision requested, reader data purged, deprovisioned, reactivated, deleted.

## Configuration

- **Who can do what:**
  - Any admin can create a tenant and edit its name, domain, plan, language and pending owner email.
  - A SUPERADMIN, or the tenant's own OWNER from `/dashboard`, can retry provisioning. Only a SUPERADMIN can deprovision, reactivate or delete. Creating a tenant (any admin) starts the first run.
- **Unknown owner email:** if the email has no user yet, the wizard requires an HMAC confirmation token. The owner then gets an OWNER invite and a magic-link email ([tenant access](./tenant-access.md)).
- **Platform env:** `WORKER_ENQUEUE_URL` and `WORKER_ENQUEUE_SECRET` sign and send each enqueue. Either missing, the enqueue is skipped and logged and the action reports a server error. `TENANT_PROVISIONING_GITHUB_TOKEN` (`actions: write`), `TENANT_PROVISIONING_GITHUB_REPO` and `TENANT_PROVISIONING_DATASET` drive the deprovisioning dispatch.
- **Worker env:** the provisioning secrets live on the `worker-dev`/`worker-prod` projects ([environment variables](../context/environment-variables.md)).
- **Workflow env:** each remaining workflow resolves its secrets from the dispatched GitHub Environment: `SANITY_MANAGEMENT_TOKEN`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID_WEB`, `ADMIN_APP_BASE_URL`, `WEB_APP_URL`, `TENANT_TOKEN_ENCRYPTION_KEY`, `OPERATOR_ALERT_SECRET`, and `TENANT_REGISTRY_DATABASE_URL` (mapped to `DATABASE_URL`).

## Constraints and invariants

- **Admission:** `beginTenantProvisioning` admits a run in one atomic `UPDATE … RETURNING`. It accepts a row that is not PROVISIONING, or one whose run is provably dead: a failed step since `startedAt`, a recorded finish, or no start recorded, or a start older than 30 minutes. A run admitted within the last 2 minutes is never treated as dead. Only the worker calls it; the admin panel maps the worker's 409 to "already in progress" and its 404 to "not found".
- **Queued run:** a run is queued while `run.admittedAt` is set and the status is PROVISIONING; the workflow's start replaces the `run` entry and drops it.
- **Overall status:** any FAILED step settles the status to FAILED. Only `VERIFY_CONTENT` finishing settles READY.
- **Timeouts:** every Sanity management and Vercel call aborts after 30 seconds, so a hung call fails its step instead of stalling the run.
- **Project membership:** `SANITY_MANAGEMENT_TOKEN` is an implicit administrator only of projects it created. A tenant row pointing at a project created elsewhere, such as the shared dev project, gets a 401 from the webhook API until the token's robot is added to that project as administrator; the step's error says so.
- **Idempotency:** every step reads state it already created and resumes; the project id is persisted the moment it is minted, since Sanity cannot delete an orphan. A retry from the status view enqueues a whole new run, not one step.
- **Worker runs:** the enqueue route admits the run through `beginTenantProvisioning`, then starts a Vercel Workflow run (`workflow`, pinned exactly to 5.x). If the start fails after admission, the run is recorded as failed (`SANITY_PROJECT` FAILED, run finished), never left PROVISIONING. The run calls four units in order: `ensureInfrastructure` (`SANITY_PROJECT`, `PERSIST_TOKEN`, `CREATE_WEBHOOK`, `MAP_DOMAIN`), `inviteOwner`, `applySiteTemplate` (`SEED_CONTENT`) and `verifyTenant` (`VERIFY_CONTENT`). It reports under the same six step keys, so the status view is unchanged. A failing unit is retried up to three times and the run resumes from it, never from the start; after the last attempt the step is FAILED. The owner invite runs inside the `SANITY_PROJECT` step; `inviteOwner` then records that invite's id and sent-at, sending one only if the owner has none, and never fails the run. Document validation is not a worker unit, since the validator needs the Sanity CLI and the Studio source, which a Vercel function lacks; a fresh tenant holds only the starter documents, which `starter-content.test.ts` validates, and `validate-tenant-documents.yml` stays a manual drift check. Audit events carry the actor `worker`.
- **Owner Studio access (worker):** a successful worker run starts `ensureOwnerAccess`, a separate Workflow run per tenant (hook token `owner-access:<tenantId>`). Each check finds the owner among the project's users by email (Access API `/access/project/{id}/users`); an owner who is already a user of the Sanity organization is added to the project as `viewer` directly, with no invite. A found owner is granted `administrator` through the project ACL (on every plan for now) and their acceptance time, Sanity user id, login provider and role are recorded. Checks run every minute for the first 30, then hourly, and stop at a grant or at STALLED: no acceptance three days after the invite was sent (else the tenant's creation). A check that still fails after its retries, such as during a Sanity outage, is logged and reported as that tick's PENDING_ACCEPTANCE or STALLED, and the checks carry on. While no invite has been recorded, for example because `inviteOwner`'s send failed, each check sends one and records its sent-at. STALLED posts the `OWNER_ELEVATION` operator alert once, deduplicated on `lastNotifiedOwnerElevationOutcome`. Each check reports under the `OWNER_ELEVATION` step with the same outcomes, so the platform banner is unchanged. "Check now" wakes the running checks, or starts new ones once they have stopped; Resend revokes the owner's pending invites, sends a new `viewer` invite, records it and restarts the checks. The parked recheck cron stays until #5596 retires it.
- **Owner emails (worker):** the owner receives three emails from the platform, each at most once per invite. The invite heads-up goes out when the Sanity invite is recorded. The nudge goes out on the first check at least 24 hours after the invite (`ownerInviteSentAt`) while the owner still has not accepted. Site ready goes out when a check grants access (ELEVATED or ALREADY_ADMINISTRATOR); it links to the Studio, and the nudge links to the dashboard. Each is sent through `@blog/email`'s owner templates with fixed transactional copy in the site's default language (`tenants.locale`), from `OWNER_EMAIL_FROM_ADDRESS`. A resend clears the heads-up and nudge sent-ats as it records the new invite, so the owner gets a fresh heads-up and the nudge restarts from the new `ownerInviteSentAt`. A send first claims its sent-at column with a conditional update, so overlapping checks or a retried step never send twice. A failed send is logged (`owner_email.send_failed`), releases its claim and never fails the step; a pending check retries a heads-up that has not gone out.
- **Starter content is schema-valid:** `packages/studio/src/starter-content.test.ts` builds the Blog and Blank starter documents and runs Sanity's own document validation (`@sanity/validation`) against the schema the real Studio config compiles, once per default language in `LOCALE_ISO_CODES`, and fails on any marker. It runs in `pnpm verify` and CI, so an invalid starter document is caught before any tenant is seeded with it. Drift in a tenant's content after creation is `validate-tenant-documents.yml`'s job.
- **No hard deletes:** deprovisioning only archives. It defaults to a dry run, and `confirm` must equal the tenant's name; the workflow checks that again. An already-deprovisioned tenant is skipped, so a failed cache purge is retried through `invalidate-tenant-cache.yml`.
- **Delete:** delete refuses a tenant that is not archived. It hard-deletes the row and cascades. No Sanity token is passed, so the archived project is left in place.
- **Locked fields:** details lock once provisioning is RUNNING or SUCCEEDED. After a failure, only `primaryDomain` locks, and only once `MAP_DOMAIN` is DONE. The owner email can change only while the invite is unaccepted.
- **Draft rows:** a draft tenant is ACTIVE with PENDING provisioning. Its domain row exists from creation, so the [multi-tenancy](./multi-tenancy.md) read gate (READY in production) keeps it dark until the run succeeds.

## Dependencies

- **Layers:** `@blog/config` owns the starter documents (`src/starter-content/`), pure data typed by the generated Sanity types, so every layer that seeds or checks them can import them. `@blog/db` owns the deprovisioning and sweep scripts (the scoped `@blog/insight` exception), the queries and the one Sanity management client (`src/utils/sanity-management-client/`). `apps/worker` owns the provisioning steps (`src/steps/`) and runs them as Vercel Workflow units, or once through its break-glass CLI. `apps/platform` enqueues to the worker and renders. `apps/web` provides the two revalidation endpoints.
- **Features:** [multi-tenancy](./multi-tenancy.md), [tenant access](./tenant-access.md), [embedded studio](./embedded-studio.md), [audit and findings](./audit-and-findings.md), [operator alerts](./operator-alerts.md), [platform shell](./platform-shell.md), [cross-tenant migrations](./cross-tenant-migrations.md).

## Entry points

- `apps/worker/src/app/api/provision/route.ts`
- `apps/worker/src/workflows/provision-tenant.ts`
- `apps/worker/src/cli/provision-tenant.ts`
- `apps/worker/src/workflows/ensure-owner-access.ts`
- `apps/worker/src/app/api/owner-access/{check,resend}/route.ts`
- `packages/db/scripts/deprovision-tenant/run.ts`
- `packages/db/scripts/recheck-tenant-owners/run.ts`
- `packages/db/src/queries/tenants/begin-tenant-provisioning/begin-tenant-provisioning.ts`
- `packages/db/src/queries/tenants/create-tenant-draft/create-tenant-draft.ts`
- `apps/platform/src/server/tenants/create-tenant-action.ts`
- `apps/platform/src/server/provisioning/start-provisioning.ts`
- `apps/platform/src/server/provisioning/enqueue-provisioning.ts`
- `apps/platform/src/server/github/dispatch-github-workflow.ts`
- `apps/platform/src/utils/use-provisioning-poll/use-provisioning-poll.ts`

## Tests and stories

- Co-located tests throughout `packages/db/scripts/**`.
- `packages/db/src/queries/tenants/**` tests (PGlite).
- `packages/utils/src/enqueue-signature/enqueue-signature.test.ts`: the enqueue signature.
- `apps/worker/src/**/*.test.ts`: the enqueue route, the steps, the units' retry and failure reporting, the workflow's order, the break-glass CLI, the owner-access checks, polling and wake-ups, invite resend, the operator alert, and the owner emails' claim, language and retry.
- `apps/platform/src/server/{provisioning,github,tenants}/*.test.ts`, `components/features/tenants/**/*.test.tsx` and the route `page.test.tsx` files.
- `packages/studio/src/starter-content.test.ts`: every starter document validates against the Studio schema in every default language.
- `apps/platform` has no Storybook.

## Related

- 4840: platform front door epic. It moves provisioning to `apps/worker`, adds TRIAL / PAST_DUE and a deletion path, and drives owner Studio access.
- 2798: site templates at tenant creation (under 4840).
- 4945: the webhook step decides from the hooks that exist.
- 4947: provisioning end to end on dev.
- 4953: site type, template version and owner-access columns.
- 4954: scaffold `apps/worker`.
- 4955: owner Studio access.
- 4961: retire Actions provisioning to a break-glass CLI.
- 4962: decide the deletion path and the abandoned-tenant sweep.
