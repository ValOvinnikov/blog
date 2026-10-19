---
title: Cross-tenant migrations
status: built
layers: [studio, db]
code:
  - packages/studio/migrations/**
  - packages/studio/scripts/migrate.mjs
  - packages/studio/scripts/migrate-lib*.mjs
  - packages/studio/src/schema-types/documents/system/migration-state/**
  - packages/db/scripts/migrate-tenant-content/**
  - .github/workflows/migrate-tenant-content.yml
epics: [4840]
---

# Cross-tenant migrations

## What it does

One `@blog/studio` schema serves many Sanity projects: the platform's own console project, and one project per tenant. When a schema change alters an existing shape, a content migration rewrites the documents to match. This feature runs those migrations against every tenant's dataset, not only the console's. Each run records what it applied in that dataset's ledger, so the run is safe to repeat and resumes where it stopped. A tenant created later catches up on the next run. Editors and owners never see any of this.

## Surfaces and routes

- **Commands.** Engineers write migrations under `packages/studio/migrations/<timestamp>-<slug>/` using these commands:
  - `migrate:new` creates a migration; `migrate:track` and `migrate:current` select and show the one being worked on;
  - `migrate:dry` and `migrate:run` dry-run or apply it;
  - `migrate:deploy` and `migrate:backfill` work through the ledger;
  - `dataset:export` takes a backup.
    All are in `packages/studio/package.json`.
- **Releases.** `release.yml`, dispatched from the platform's Releases page, migrates the production database, then the console project and every active tenant, before it tags and deploys. A failed tenant migration stops the release before the tag, so the previous web keeps serving.
- **Console project.** `migrate-production-content.yml` runs `migrate:deploy --yes` for `release.yml`, and for `deploy-production.yml` on a hand-pushed `vX.Y.Z` tag. `deploy-development.yml` runs it too, but that workflow's `push` trigger is commented out, so it only runs when dispatched by hand.
- **Tenant projects.** `migrate-tenant-content.yml` has three triggers:
  - **`push` to `main`:** runs against the `development` Environment, for all tenants. It runs only when `turbo-ignore` reports that `@blog/studio` or `web` is affected.
  - **`workflow_dispatch`:** defaults to `production` and takes an optional `tenantId`.
  - **`workflow_call`:** takes an optional `tenantId` (blank migrates every tenant), `environment` and `ref`. `release.yml` calls it for every tenant.
- **CI check.** The `Migrations` job in `ci.yml` loads every migration (`sanity migrations list`). When a read token is configured, it also dry-runs them against the console dataset only.

## Data

- **Ledger.** The ledger is the `migrationState` document (`_id` and `_type` both `migrationState`) in each dataset. Its `applied[]` holds `{ id, runAt, sha }`.
  - It has a declared schema type so validation and typegen see it, but editors can't touch it: document actions are disabled, and it is left out of the desk and the new-document menu.
  - Each dataset keeps its own ledger, so development and production track separately, and so does every tenant.
- **Tenant selection.** `listActiveTenants` returns tenants that are `status = ACTIVE` with a null `deprovisionedAt`. A single-tenant run uses `getTenantById`.
- **Credentials.** `getTenantSanityWriteCredentials` decrypts the tenant's own `sanityWriteTokenEncrypted` for each run. A tenant with no write token, or one that is not ACTIVE, is counted as skipped.
- **No caching.** Migrations write straight to Content Lake. Published changes reach the site through the normal revalidation webhook ([rendering and caching](./rendering-and-caching.md)).

## Configuration

- **No editor or owner control.** No editor, owner or operator setting changes migration behaviour.
- **Who runs what.**
  - Engineers write migrations.
  - A production run happens through a release or an explicit dispatch. The `production` Environment has no protection rules, so the platform's Release button is the human gate.
- **Fan-out env.** The fan-out reads `TENANT_REGISTRY_DATABASE_URL` (mapped to `DATABASE_URL`) and `TENANT_TOKEN_ENCRYPTION_KEY` from the resolved Environment.
- **Per-tenant overrides.** Each tenant's invocation overrides `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` and `SANITY_AUTH_TOKEN`.
- **`migrate.mjs` env.** `migrate.mjs` itself reads `SANITY_AUTH_TOKEN`, falling back to `SANITY_DEPLOY_TOKEN`. `SANITY_STUDIO_DATASET` defaults to `production`.

## Constraints and invariants

- **Changes go expand, then contract.** Tenant projects reach a new schema independently, and there is no atomic cutover. So a change adds the new shape, migrates every tenant, and removes the old shape in a later change, never in one step.
- **A migration must handle both shapes.** It has to be safe on documents in the old and the new shape, and re-running it on migrated input must be a no-op. A test proves this, either co-located with the migration or on the `migrations/lib/` helper it is built from.
- **An empty ledger is backfilled, never replayed.** `isTenantMigrationLedgerEmpty` runs before every tenant's deploy. If the ledger is empty, the call switches to `deploy --backfill`, which marks migrations applied without running them. A tenant seeded from starter content is already at the current schema.
- **Each tenant uses its own write token.** No organisation-scoped content token exists, so one leaked credential reaches exactly one tenant.
- **Production runs only from a release or a dispatch.** The production tenant fan-out never runs on a pushed tag. One run rewrites customer content across every project at once.
- **`deploy` stops at the first failing migration.** For each pending id, in order, it dry-runs, then runs, then appends to the ledger. If one fails it stops there, so the ledger is accurate up to the last migration that succeeded.
- **A failing migration deploy for one tenant never stops the sweep, but a failure to read or decrypt a tenant's credentials does.** Tenants run one after another; each deploy is wrapped in its own error handling, while the credentials read runs before it and aborts the run. Otherwise the job exits 1 only when a deploy errors, or when a requested `tenantId` is not found.
- **Concurrency.** Runs are serialised per environment and tenant scope, without cancelling an earlier run, and time out after 45 minutes.
- **A production run exports each tenant first.** With `TENANT_EXPORT_DIR` set, which the workflow does for production only, each tenant's dataset is exported just before its migration, and a failed export counts as that tenant's error without migrating it. The exports upload as one artifact, kept 30 days. The daily tenant backups (#5095) replace this.
- **Code limits on migrations.** A migration never imports a Studio schema module, bare `sanity` or React; `sanity/migrate` is fine. A file in `migrations/lib/` depends only on `@blog/config`, `@blog/utils`, `sanity/migrate` and Node built-ins. One bad import stops every migration from loading at once.
- **A separate read-only check.** `validate-tenant-documents` runs the same per-tenant fan-out, read-only, recording drift as findings ([tenant provisioning](./tenant-provisioning.md), [audit and findings](./audit-and-findings.md)).

## Dependencies

- **Layers:** `@blog/studio` owns the schema, the migrations and `migrate.mjs`. `@blog/db` owns the fan-out script, the tenant registry and the encrypted tokens; this is its scoped `sanitizeLogMessage` exception.
- **Features:** [multi-tenancy](./multi-tenancy.md), [tenant provisioning](./tenant-provisioning.md) (which seeds the starter content and mints the write token), [studio authoring](./studio-authoring.md).

## Entry points

- `packages/db/scripts/migrate-tenant-content/run.ts`
- `packages/db/scripts/migrate-tenant-content/lib/read-tenant-migration-ledger.ts`
- `packages/db/scripts/migrate-tenant-content/lib/run-tenant-migrate-script.ts`
- `packages/studio/scripts/migrate.mjs`
- `packages/studio/scripts/migrate-lib.mjs`
- `packages/studio/migrations/README.md`
- `.github/workflows/migrate-tenant-content.yml`

## Tests and stories

- `packages/db/scripts/migrate-tenant-content/run.test.ts` and `lib/*.test.ts`. These mock `execFileSync`, so no Sanity call is made.
- `packages/studio/scripts/migrate-lib.test.mjs`, covering ledger ordering and pending computation.
- A co-located `index.test.ts` in most migration folders. A migration that only wires up a shared helper is covered by that helper's test in `packages/studio/migrations/lib/*.test.ts`.
- No Storybook; this feature has no UI.

## Related

- 4840: platform front door epic. The platform tenant joins the fan-out, and post-provisioning document validation moves into the `apps/worker` units.
