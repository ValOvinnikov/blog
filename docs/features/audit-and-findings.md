---
title: Audit events and findings
status: partial
layers: [db, platform, config]
code:
  - packages/db/src/schema/audit-events.ts
  - packages/db/src/schema/findings.ts
  - packages/db/src/queries/audit-events/**
  - packages/db/src/queries/findings/**
  - packages/config/src/constants/audit.ts
  - packages/config/src/constants/finding.ts
  - packages/db/scripts/validate-tenant-documents/**
  - packages/db/scripts/provision-tenant/lib/record-provisioning-audit-event.ts
  - packages/db/scripts/deprovision-tenant/lib/record-*-audit-event.ts
  - apps/platform/src/server/audit/**
  - apps/platform/src/server/findings/**
  - apps/platform/src/app/**/findings/**
  - apps/platform/src/components/features/findings/**
  - apps/platform/src/components/features/tenants/findings-card/**
  - apps/platform/src/components/features/tenants/recent-activity-card/**
  - apps/platform/src/testing/audit-events/**
  - apps/platform/src/testing/findings/**
  - .github/workflows/validate-tenant-documents.yml
epics: [4843, 4840]
---

# Audit events and findings

## What it does

Two Postgres records that sit beside the log stream. `audit_events` is an
append-only log of who did what to a tenant: created, reconfigured,
provisioned, archived, deleted. `findings` holds operational conditions a
human should act on, each open or resolved and usually tied to a tenant.
Operators see a tenant's recent activity and open findings on its overview,
and every open finding on the platform-wide Findings page. Tenant owners see
neither.

## Surfaces and routes

- `/findings` (operator, `requireAdmin`): every OPEN finding, newest
  `lastSeenAt` first, with tenant (linking to `/tenants/{id}`, or marked
  platform-wide), source, kind, severity and last-seen date.
- `/tenants/{id}` overview: the Findings card (OPEN findings, with a
  disclosure that loads `details` on open) and the Recent activity card (the
  last five `TENANT` audit events: action, actor email, relative time).
- `/tenants/{id}/danger`: reads the latest `DEPROVISION_REQUESTED` time to
  decide whether a deprovisioning run is current or a retry.
- No page lists `SITE_CONFIG` or `SETTINGS_FEATURES` events, and no UI
  resolves a finding by hand.

## Data

- `audit_events`: `actorId`, `actorEmail` (a snapshot taken at insert),
  `action`, `targetType`, `targetId` (no foreign key; rows outlive their
  target), `details` jsonb, `createdAt`. Indexed on (`targetType`,
  `targetId`).
- `findings`: `tenantId` (nullable, cascades on tenant delete), `source`,
  `kind`, `severity`, `status`, `dedupeKey`, `details` jsonb, `firstSeenAt`,
  `lastSeenAt`, `resolvedAt`. A partial unique index allows one OPEN row per
  `dedupeKey`.
- Vocabularies in `@blog/config`: `AUDIT_ACTION`, `AUDIT_TARGET_TYPE`,
  `FINDING_SOURCE`, `FINDING_KIND`, `FINDING_SEVERITY`, `FINDING_STATUS`. All
  are stored as plain `text`, so adding a value needs no migration.
- Writers today:
  - Platform Server Actions (actor = the session user): `CREATED`,
    `DEPROVISION_REQUESTED`, `REACTIVATED`, `DELETED` and `SETTINGS_UPDATED`.
    Tenant details and languages use target `TENANT`; Look, Voice, brand
    assets, email logo, email config and email templates use `SITE_CONFIG`;
    Features uses `SETTINGS_FEATURES`. `targetId` is always the tenant id.
  - CLI workflows (actor `github:<actor>`): `PROVISIONED`,
    `PROVISIONING_FAILED` (with the failed step and run id), `DEPROVISIONED`,
    `READER_DATA_PURGED`.
  - Findings: only `validate-tenant-documents` writes, as
    `DOCUMENT_VALIDATION` / `SCHEMA_VALIDATION_ERROR` (CRITICAL if any
    document has an error, else WARNING), and resolves it on a clean run.
    The other declared sources and kinds have no writer yet.
  - The release actions (`RELEASE_STARTED`, `RELEASE_OVERRIDE`,
    `CONTRAST_CHECK_STARTED`, `TENANT_MIGRATIONS_STARTED`) and the `RELEASE`
    target type are declared with no writer yet
    ([Platform releases](platform-releases.md)).
  - `recordContrastResult` writes one platform-wide `CONTRAST_CHECK` /
    `CONTRAST_REGRESSION` finding per commit SHA, with the posted
    `TContrastResultBody` as `details`. No caller uses it yet.
- Pages read straight from Neon on each request; nothing is cached.

## Configuration

Nothing is configurable. Only admins (any role) see either record.

## Constraints and invariants

- `audit_events` is insert-only, through `insertAuditEvent`.
- `recordAuditEvent` never throws and never changes its caller's result. A
  lost audit write is logged at `error` under the caller's `logEvent` and
  swallowed, because `neon-http` cannot couple the two writes in a
  transaction.
- An action never reuses a `TENANT_STATUS` value. A run spanning two
  systems records request then outcome: `CREATED` before
  `PROVISIONED`/`PROVISIONING_FAILED`, `DEPROVISION_REQUESTED` before
  `DEPROVISIONED`.
- `AUDIT_ACTION` and `AUDIT_TARGET_TYPE` stay in `@blog/config` even though
  only `db` and the platform read them.
- `openFinding` builds the dedupe key from source, kind, tenant (or
  `global`) and a caller identifier. An existing OPEN finding is refreshed in
  place (`lastSeenAt`, severity, details), and `isNewlyOpened` tells a sweep
  whether this is a fresh healthy-to-failing transition. Only that triggers
  an [operator alert](./operator-alerts.md).
- `resolveFinding` on a stale or already resolved id returns `DB_NOT_FOUND`,
  not a throw. A later failure opens a new row and keeps the resolved one as
  history.
- A contrast finding is keyed by SHA, never by tenant, and a SHA has one
  row. A failing run is OPEN and CRITICAL; a passing run is stored RESOLVED,
  so it is the SHA's result without being listed as open. A re-run refreshes
  that row (status, `resolvedAt`, `lastSeenAt`, `details`), so a pass closes
  a failure and a later failure reopens it. `getContrastFinding` reads a
  SHA's row in any status; `getLatestPassingContrastSha` returns the SHA of
  the RESOLVED row with the newest `lastSeenAt`, or `undefined`.
  `tagContrastFinding` adds the release tag to `details`, and a re-run
  without a tag keeps it.
- Findings are not an error tracker: runtime exceptions stay in the logs.
- Finding details load on demand through `getFindingDetailsAction`, gated by
  `requireTenantById` and scoped to the finding's tenant.
- The document-validation sweep is advisory: it exits 1 on a systemic error
  or a `--tenant-id` with nothing to check, never on invalid documents. It
  runs on manual dispatch and after each successful provisioning run (its
  weekly cron is commented out), skipping non-ACTIVE or deprovisioned tenants.
- Deprovisioning keeps `findings` and `audit_events`. Deleting an archived
  tenant cascades its findings away; its audit rows remain.

## Dependencies

- `@blog/db`, `@blog/config`; `@blog/insight` (`sanitizeLogMessage`) in the
  CLI scripts; the platform logger.
- Features: [tenant-provisioning](./tenant-provisioning.md),
  [operator-alerts](./operator-alerts.md),
  [platform-shell](./platform-shell.md), [look](./look.md),
  [voice](./voice.md), [email](./email.md).
- Env: `DATABASE_URL` (CI: `TENANT_REGISTRY_DATABASE_URL`),
  `TENANT_TOKEN_ENCRYPTION_KEY`; the alert needs `ADMIN_APP_BASE_URL` and
  `OPERATOR_ALERT_SECRET` and is skipped without either.

## Entry points

- `apps/platform/src/server/audit/record-audit-event.ts`
- `packages/db/src/queries/findings/open-finding/open-finding.ts`
- `packages/db/src/queries/findings/record-contrast-result/record-contrast-result.ts`
- `packages/db/scripts/validate-tenant-documents/run.ts`
- `apps/platform/src/app/[locale]/(operator)/findings/page.tsx`
- `apps/platform/src/components/features/tenants/tenant-overview-view/tenant-overview-view.tsx`

## Tests and stories

- Query tests beside each file in `packages/db/src/queries/audit-events/**`
  and `packages/db/src/queries/findings/**`.
- `packages/db/scripts/validate-tenant-documents/run.test.ts` and `lib/*.test.ts`.
- `apps/platform/src/server/audit/record-audit-event.test.ts`,
  `apps/platform/src/server/findings/get-finding-details-action.test.ts`, the
  findings page test, and the component tests beside the findings table,
  view, card, details and recent-activity card. Fixtures live in
  `apps/platform/src/testing/`. No Storybook.

## Related

- #4843 a finding when a tenant's Sanity project nears its document cap.
- #4840 epic: platform front door (self-serve creation writes an audit
  event; provisioning moves to a worker with a generic actor and run URL).
