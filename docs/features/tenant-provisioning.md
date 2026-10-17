---
title: Tenant provisioning
status: built
layers: [db, platform, web, config]
code:
  - packages/db/scripts/provision-tenant/**
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
  - .github/workflows/*provision-tenant.yml
  - .github/workflows/invalidate-tenant-cache.yml
  - .github/workflows/recheck-tenant-owners.yml
epics: [4840, 2798]
---

# Tenant provisioning

## What it does

An operator creates a tenant in the admin. That inserts a draft row and dispatches a GitHub Actions workflow, which gives the tenant everything it needs:

- its own Sanity project and dataset;
- starter content;
- read and write tokens;
- a domain on the shared web Vercel project;
- a revalidation webhook.

The workflow then verifies all of it. The admin polls each step's progress and offers Retry. Deprovisioning reverses the run: it archives the tenant, never hard-deletes it. Reactivation re-runs provisioning. Deletion is a separate, final hard delete of an archived tenant.

## Surfaces and routes

- **Operator pages (any `admins` row):**
  - `/tenants` lists tenants, with an archived toggle.
  - `/tenants/new` is the add-tenant wizard.
  - `/tenants/{id}` shows an overview with a provisioning banner.
  - `/tenants/{id}/provisioning` shows each step's status and the run. Until the workflow starts the run, it says the run is queued and counts the wait. A step that finishes between two polls is still shown Running before it settles.
  - `/tenants/{id}/domain` shows DNS records and live Vercel verification.
- **SUPERADMIN only:** `/tenants/{id}/danger` holds deprovision (with dry run), reactivate and delete.
- **Owner:** `/dashboard/domain` shows the same domain view.
- **Workflows:**
  - `provision-tenant.yml`, `deprovision-tenant.yml` and `invalidate-tenant-cache.yml` are dispatch only; provisioning calls `validate-tenant-documents.yml` when it finishes.
  - `recheck-tenant-owners.yml` and `validate-tenant-documents.yml` are dispatch only while their crons are parked.
- **Manual CLIs:** `db:seed-tenant` and `db:recover-wedged-provisioning`.

## Data

- **Provisioning state on `tenants`:**
  - `provisioningStatus` is PENDING, PROVISIONING, READY or FAILED.
  - `provisioningSteps` is jsonb, one entry per step (IDLE / RUNNING / DONE / FAILED with error and `updatedAt`), plus a `run` entry: `startedAt`, `finishedAt`, `admittedAt`, `registry` and `workflowRunUrl`.
  - Artifacts: `sanityProjectId`, `sanityDataset`, both encrypted tokens, `seededAt` and `webhookCreatedAt`.
  - `lastNotifiedOwnerElevationOutcome` and `deprovisioningSteps` (same shape as `provisioningSteps`).
- **Core steps, in order:**
  1. `SANITY_PROJECT` creates the project and dataset, adds a CORS entry for the admin origin, and invites the owner as `viewer`.
  2. `SEED_CONTENT` writes `settings_site`, `settings_navigation`, `settings_footer`, `page_home` with its `template_home`, and `page_postIndex` with its `template_postIndex`. Each document is typed against the generated Sanity types and created with `createIfNotExists` under a fixed id, so a re-run never overwrites an owner's edits. It runs only if `settings_site` is absent, using an `editor` token that is persisted on success and revoked on failure.
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
  - Only a SUPERADMIN can retry provisioning, deprovision, reactivate or delete. Creating a tenant (any admin) starts the first run.
- **Unknown owner email:** if the email has no user yet, the wizard requires an HMAC confirmation token. The owner then gets an OWNER invite and a magic-link email ([tenant access](./tenant-access.md)).
- **Platform env:** `TENANT_PROVISIONING_GITHUB_TOKEN` (`actions: write`), `TENANT_PROVISIONING_GITHUB_REPO` and `TENANT_PROVISIONING_DATASET`. `TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE` forces the `development` dataset and environment.
- **Workflow env:** each workflow resolves every secret from the dispatched GitHub Environment: `SANITY_MANAGEMENT_TOKEN`, `SANITY_ORGANIZATION_ID`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID_WEB`, `ADMIN_APP_BASE_URL`, `TENANT_SANITY_DATASET`, `WEB_APP_URL`, `SANITY_REVALIDATE_SECRET`, `TENANT_TOKEN_ENCRYPTION_KEY`, `OPERATOR_ALERT_SECRET`, and `TENANT_REGISTRY_DATABASE_URL` (mapped to `DATABASE_URL`).

## Constraints and invariants

- **Admission:** `beginTenantProvisioning` admits a run in one atomic `UPDATE … RETURNING`. It accepts a row that is not PROVISIONING, or one whose run is provably dead: a failed step since `startedAt`, a recorded finish, or no start recorded, or a start older than 30 minutes. A run admitted within the last 2 minutes is never treated as dead. A failed dispatch reverts the status.
- **Queued run:** a run is queued while `run.admittedAt` is set and the status is PROVISIONING; the workflow's start replaces the `run` entry and drops it.
- **Overall status:** any FAILED step settles the status to FAILED. Only `VERIFY_CONTENT` finishing settles READY.
- **Timeouts:** every Sanity management and Vercel call aborts after 30 seconds, so a hung call fails its step instead of stalling the run.
- **Project membership:** `SANITY_MANAGEMENT_TOKEN` is an implicit administrator only of projects it created. A tenant row pointing at a project created elsewhere, such as the shared dev project, gets a 401 from the webhook API until the token's robot is added to that project as administrator; the step's error says so.
- **Idempotency:** every step reads state it already created and resumes; the project id is persisted the moment it is minted, since Sanity cannot delete an orphan. A retry re-dispatches the whole workflow, not one step.
- **No hard deletes:** deprovisioning only archives. It defaults to a dry run, and `confirm` must equal the tenant's name; the workflow checks that again. An already-deprovisioned tenant is skipped, so a failed cache purge is retried through `invalidate-tenant-cache.yml`.
- **Delete:** delete refuses a tenant that is not archived. It hard-deletes the row and cascades. No Sanity token is passed, so the archived project is left in place.
- **Locked fields:** details lock once provisioning is RUNNING or SUCCEEDED. After a failure, only `primaryDomain` locks, and only once `MAP_DOMAIN` is DONE. The owner email can change only while the invite is unaccepted.
- **Draft rows:** a draft tenant is ACTIVE with PENDING provisioning. Its domain row exists from creation, so the [multi-tenancy](./multi-tenancy.md) read gate (READY in production) keeps it dark until the run succeeds.

## Dependencies

- **Layers:** `@blog/db` owns the scripts (the scoped Sanity and `@blog/insight` exceptions) and the queries. `apps/platform` dispatches and renders. `apps/web` provides the two revalidation endpoints.
- **Features:** [multi-tenancy](./multi-tenancy.md), [tenant access](./tenant-access.md), [embedded studio](./embedded-studio.md), [audit and findings](./audit-and-findings.md), [operator alerts](./operator-alerts.md), [platform shell](./platform-shell.md), [cross-tenant migrations](./cross-tenant-migrations.md).

## Entry points

- `packages/db/scripts/provision-tenant/run.ts`
- `packages/db/scripts/deprovision-tenant/run.ts`
- `packages/db/scripts/recheck-tenant-owners/run.ts`
- `packages/db/src/queries/tenants/begin-tenant-provisioning/begin-tenant-provisioning.ts`
- `packages/db/src/queries/tenants/create-tenant-draft/create-tenant-draft.ts`
- `apps/platform/src/server/tenants/create-tenant-action.ts`
- `apps/platform/src/server/provisioning/start-provisioning.ts`
- `apps/platform/src/server/github/dispatch-github-workflow.ts`
- `apps/platform/src/utils/use-provisioning-poll/use-provisioning-poll.ts`

## Tests and stories

- Co-located tests throughout `packages/db/scripts/**`, including `run.*.test.ts` sequencing suites.
- `packages/db/src/queries/tenants/**` tests (PGlite).
- `apps/platform/src/server/{provisioning,github,tenants}/*.test.ts`, `components/features/tenants/**/*.test.tsx` and the route `page.test.tsx` files.
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
