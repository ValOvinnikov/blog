---
title: Operator alerts
status: built
layers: [platform, email, db, config]
code:
  - apps/platform/src/app/api/internal/operator-alert/**
  - apps/platform/src/server/internal-api/**
  - apps/platform/src/server/email/resolve-operator-alert-from-address.ts
  - apps/platform/src/components/features/tenants/email-alerts-banner/**
  - packages/config/src/constants/operator-alert.ts
  - packages/db/scripts/lib/post-operator-alert*
  - packages/db/scripts/*/lib/notify-operators*
  - packages/db/scripts/provision-tenant/lib/notify-owner-elevation-outcome.ts
  - packages/db/src/queries/admins/list-superadmin-emails/**
  - packages/email/src/templates/operator/**
  - packages/email/src/html/operator-shell/**
epics: [4955, 4840]
---

# Operator alerts

## What it does

Emails the platform's SUPERADMINs when a background job finds a tenant that
needs a human. Two conditions alert today: a tenant owner's Sanity access is
stuck (the invite is unaccepted after three days, or the project has more than
one candidate owner), and a tenant's Sanity documents newly fail validation.
The CLI jobs report only facts. `apps/platform` picks the recipients, renders
the email in the platform's own look, and sends it.

## Surfaces and routes

- `POST /api/internal/operator-alert`: machine-only, with a Bearer shared
  secret. It has no UI and no session.
- The email links nowhere directly; its copy points the operator to the
  tenant's provisioning page or detail page in the platform.
- `/tenants` shows an "Email alerts not configured" warning when
  `RESEND_API_KEY` is unset, so operators know to check the page by hand.

## Data

- Wire contract (`TOperatorAlertBody` in `@blog/config`), discriminated on
  `kind`:
  - `OWNER_ELEVATION`: `tenantId` and `outcome` (`STALLED` or
    `AMBIGUOUS_MEMBERSHIP`).
  - `DOCUMENT_VALIDATION`: `tenantId`, `invalidDocumentCount` and
    `isCritical`.
    It carries no address, tenant name or HTML. The route validates it with Zod
    and looks the tenant up itself.
- Recipients: `listSuperadminEmails`, the `users.email` of every `admins` row
  with role SUPERADMIN.
- Dedupe state lives with the sender, not the route:
  `tenants.lastNotifiedOwnerElevationOutcome` for owner elevation, and the
  finding's `isNewlyOpened` for document validation (see
  [audit-and-findings](./audit-and-findings.md)).
- Nothing is cached, and no record of a sent alert is stored.

## Configuration

- Nothing is configurable in the UI. Recipients are whoever holds a SUPERADMIN
  `admins` row.
- Copy is hardcoded English in `@blog/email`'s operator templates and must
  never become tenant-editable.

## Constraints and invariants

- The route answers:
  - 500 when `OPERATOR_ALERT_SECRET` is unset (logged
    `operator_alert.secret_missing`); alerts stop rather than run
    unauthenticated.
  - 401 for a missing or wrong token (constant-time `isSecretMatch`).
  - 400 for a body that is not JSON or fails the schema.
  - 404 for an unknown or archived tenant (logged
    `operator_alert.tenant_not_found`).
  - 200 `{ sent: 0 }` when no SUPERADMIN has an email (logged
    `operator_alert.no_recipients`).
  - Otherwise one email per recipient: 200 when all send, 207
    `{ sent, failed }` when some fail, 502 when all fail. Each failure is
    logged as `operator_alert.send_failed`.
- Operator mail renders through `buildOperatorShell`, which takes no brand.
  An alert cannot render in a tenant's colours.
- From address: `OPERATOR_ALERT_FROM_ADDRESS`, else
  `Tenant Alerts <onboarding@resend.dev>`.
- `postOperatorAlert` never throws. An unset `ADMIN_APP_BASE_URL` or
  `OPERATOR_ALERT_SECRET`, a non-2xx response and a network error are each
  logged once and swallowed, so a failed alert never fails the job that
  reports it.
- An alert fires once per transition:
  - Owner elevation: only for `STALLED` or `AMBIGUOUS_MEMBERSHIP`, and only
    when the outcome differs from the last one notified. Shared by
    provisioning's own check and the recheck sweep, so the two never both
    fire for one outcome.
  - Document validation: only when the sweep opens a new finding, not when it
    refreshes an open one.
- Senders: `provision-tenant` (owner elevation right after core
  provisioning, then the post-provisioning document check),
  `recheck-tenant-owners` and `validate-tenant-documents`. Both sweeps' cron
  schedules are commented out, so they alert only on manual dispatch or as
  part of a provisioning run.

## Dependencies

- `@blog/email` (`sendEmail` over Resend, the operator templates),
  `@blog/db` (tenant lookup, superadmin emails, `ELEVATE_TENANT_OWNER_OUTCOME`),
  `@blog/utils` (`isSecretMatch`), `@blog/config`.
- Features: [tenant-provisioning](./tenant-provisioning.md),
  [audit-and-findings](./audit-and-findings.md), [email](./email.md),
  [tenant-access](./tenant-access.md).
- Env:
  - Platform: `OPERATOR_ALERT_SECRET`, `OPERATOR_ALERT_FROM_ADDRESS`,
    `RESEND_API_KEY`.
  - CI (GitHub Environment): `OPERATOR_ALERT_SECRET` (byte-identical to the
    platform's), `ADMIN_APP_BASE_URL`.

## Entry points

- `apps/platform/src/app/api/internal/operator-alert/route.ts`
- `packages/db/scripts/lib/post-operator-alert.ts`
- `packages/db/scripts/provision-tenant/lib/notify-owner-elevation-outcome.ts`
- `packages/db/scripts/validate-tenant-documents/lib/notify-operators.ts`
- `packages/email/src/templates/operator/owner-elevation-alert.ts`,
  `document-validation-alert.ts`

## Tests and stories

- `apps/platform/src/app/api/internal/operator-alert/route.test.ts`
- `packages/db/scripts/lib/post-operator-alert.test.ts` and
  `packages/db/scripts/*/lib/notify-operators.test.ts`;
  `packages/db/scripts/recheck-tenant-owners/run.owner-elevation-notification.test.ts`.
- `packages/email/src/templates/operator/*.test.ts` and
  `packages/email/src/html/operator-shell/operator-shell.test.ts`.
- `apps/platform/src/components/features/tenants/email-alerts-banner/email-alerts-banner.test.tsx`.
- No Storybook.

## Related

- #4955 the worker's owner access check alerts once on STALLED and retires
  the AMBIGUOUS heuristic and the recheck cron.
- #4840 epic: platform front door (provisioning and its alerts move to a
  worker).
