# Content-Migration Deployment Automation — Design Spec

**Status:** Design (not yet implemented). Deferred until the #242 schema phases
are complete, per project decision.
**Date:** 2026-07-10
**Related:** #241 (migration tooling), the migration helper
(`apps/cms/scripts/migrate.mjs`), the CI migration guard (`.github/workflows/ci.yml`
`Migrations` job).

## Goal

Run Sanity content migrations **automatically and safely as part of shipping**,
so a schema-changing merge migrates the live dataset **before** the new code
serves it — replacing today's fully-manual "run the migration before you deploy"
step. Only **un-applied** migrations run, exactly once, in a deterministic order.

## Background — why it's manual today

- Sanity content and schema are decoupled: changing the schema does not change
  existing documents. A **content migration** transforms the data to match (see
  `apps/cms/migrations/README.md`).
- Our service projections use `.notNull()` and expect the migrated shape, so if
  the web app deploys before the migration runs, production fetches fail
  (`ok:false` → `notFound()`/fallbacks → broken pages).
- Today: Vercel auto-deploys on merge to `main`; migrations are a **separate,
  human-run** step (`migrate:dry` → `migrate:run`). CI only **validates**
  migrations load (read-only guard) — it never runs them. Nothing enforces
  "migrate before deploy".

## The core problem to solve

**Sanity has no built-in ledger of applied migrations** (unlike Rails'
`schema_migrations` table). So automation cannot naïvely "run every migration in
the folder on every deploy" — that re-applies already-applied migrations forever
and only works if every migration is perfectly idempotent (fragile). We must
track what has run, per dataset, and run only the rest.

## Non-goals

- Transactional/atomic migrations across documents (Sanity applies mutations
  per-document; not in scope to change).
- Replacing human judgment for high-risk migrations — a manual approval gate
  remains available (see Safeguards).
- Auto-running against `production` from **PR** CI (never — see Triggers).

## Design overview

Four pieces:

1. **Timestamped migrations** — ordered, like Rails/Prisma.
2. **A per-dataset applied-migrations ledger** — a Sanity document.
3. **A `migrate:deploy` command** — runs only un-applied migrations, in order,
   recording each.
4. **A gated deploy workflow** — post-merge, with a write token, a durable
   backup, and release ordering.

### 1. Timestamped migrations

Extend `migrate:new` to prepend a UTC timestamp to the folder slug:

```
migrate:new "unify links"  ->  migrations/20260710T1200-unify-links/
```

Gives a deterministic lexicographic run order across migrations authored on
different branches/dates. Existing (un-timestamped) migrations are treated as
"ordered before" any timestamped one (or backfilled once).

### 2. Applied-migrations ledger (per dataset)

A single Sanity document per dataset records what has run:

```jsonc
// _id: 'migrationState'  (_type: 'migrationState', system-ish doc)
{
  "_id": "migrationState",
  "_type": "migrationState",
  "applied": [
    {
      "id": "20260710T1200-unify-links",
      "runAt": "2026-07-10T12:05:00Z",
      "sha": "<git sha>",
    },
  ],
}
```

- **Per-dataset** (lives _in_ the dataset) → `production` and `development`
  track independently; no drift.
- Written transactionally with each successful run.
- Reading it tells `migrate:deploy` exactly which migrations remain.

> Alternative considered: a committed `applied.json`. Rejected — it's not
> per-dataset (prod vs dev diverge) and races across branches.

### 3. `migrate:deploy` command

New helper subcommand (extends `apps/cms/scripts/migrate.mjs`):

```
pnpm --filter cms migrate:deploy [--yes]
```

Algorithm:

1. Read the `migrationState` ledger for the resolved dataset
   (`SANITY_STUDIO_DATASET`, default `production`).
2. Compute `pending = folderMigrations(sortedByTimestamp) - ledger.applied`.
3. If none pending → exit 0 (no-op; safe to run every deploy).
4. For each pending migration, in order:
   a. **dry-run** — abort the whole job on any error.
   b. **run** (`--no-dry-run --no-confirm`).
   c. append `{ id, runAt, sha }` to the ledger (transactional).
5. Stop on first failure (leaves the ledger accurate up to the last success).

This makes "run migrations on deploy" **idempotent at the orchestration level**
regardless of whether individual migrations are idempotent.

### 4. Deploy workflow (post-merge, gated)

A **separate** workflow from PR CI:

```
on: push:  branches: [main]        # NOT pull_request
jobs:
  migrate:
    environment: production         # GitHub "environment" -> optional required reviewer (manual approval gate)
    steps:
      - setup
      - typegen check (fail if generated types are stale)
      - dataset:export  ->  upload-artifact (durable backup; retention e.g. 30d)
      - migrate:deploy --yes         # runs only pending, in order, dry-then-run, records ledger
    # secrets: SANITY_DEPLOY_TOKEN (write), SANITY_STUDIO_DATASET=production
```

- **PR CI keeps only the read-only guard** we already have (validate load +
  optional dry-run). PRs never mutate data.
- **Release ordering:** the Vercel web deploy must not serve new code until
  `migrate` succeeds. Options (pick during implementation):
  - Gate the Vercel "Production" deploy on this workflow (Vercel deploy hook /
    GitHub deployment status), or
  - Run migrations against a promotion dataset and swap, or
  - Accept a small window and rely on the code's `ok:false` fallbacks (weakest).

## Safeguards

- **Manual approval gate:** the `production` GitHub _environment_ can require a
  reviewer, so `migrate:deploy` on prod still needs one click — keeping the
  human-gated spirit while automating the mechanics.
- **Durable backup first:** `dataset:export` uploaded as a CI artifact (or to
  S3 / Sanity's own scheduled backups on paid plans). A backup on the ephemeral
  runner is not a backup.
- **Dry-run gates the run:** any dry-run error aborts before mutating.
- **Non-atomic reality:** mutations apply per-document; a mid-run failure leaves
  partial state. Recovery = the backup + re-running the (idempotent) remainder.
  Prefer migrations written defensively (guard already-migrated docs, as
  `unify-links` does).
- **Least-privilege token:** a dedicated write token scoped to the dataset,
  stored as a GitHub Actions secret, used only by this workflow.

## Security

Auto-running against `production` requires a **write token in CI** — a powerful
credential. Mitigations: dedicated least-privilege token, `production`
environment protection (required reviewer), token rotation, and never exposing
it to PR CI (which runs untrusted contributor code).

## Datasets

`SANITY_STUDIO_DATASET` already selects the dataset for the helper and
`sanity.cli.ts`. The deploy workflow sets it to `production`; a
`development`/`staging` dataset gets its own ledger and can be migrated first as
a rehearsal (`SANITY_STUDIO_DATASET=development migrate:deploy`).

## Is the user's proposed flow correct?

Mostly yes. Corrections captured above:

- ✅ timestamped create, ✅ local dry-run, ✅ CI typegen → backup → dry → run.
- ✏️ **not** "run all migrations" → **run only un-applied** (ledger).
- ✏️ run on **post-merge / deploy**, not PR CI.
- ✏️ needs a **write token** + **durable backup** + **release ordering** vs Vercel.

## Rollout (incremental)

1. **Timestamped `migrate:new`** (tiny helper change).
2. **Ledger + `migrate:deploy`** in `migrate.mjs` (reads/writes `migrationState`,
   runs pending in order). Locally usable immediately:
   `SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:deploy`.
3. **Backfill** the ledger with already-applied migrations (one-time, per
   dataset) so they aren't re-run.
4. **Deploy workflow** (post-merge, gated, write token, backup artifact).
5. **Wire release ordering** with Vercel.

Steps 1–3 are safe and useful on their own (local/staging); 4–5 are the
production-automation commitment.

## Open questions

- Release ordering mechanism with Vercel (deploy hook vs gated promotion vs
  accept-window) — needs a look at the current Vercel setup.
- Backup destination (CI artifact vs S3 vs Sanity scheduled backups) and
  retention.
- Do we want a manual approval gate on `production` (recommended) or full
  auto-run?
- Ledger `_type` (`migrationState`) — keep it out of typegen/Studio (a system
  doc), or model it explicitly?

## Acceptance criteria (for the future implementation)

- `migrate:new` produces timestamped folders.
- `migrate:deploy` runs only un-applied migrations, in order, dry-then-run,
  recording each in a per-dataset ledger; a second run is a no-op.
- A post-merge workflow runs `migrate:deploy` against `production` with a write
  token, after a durable backup, behind an approval gate, ordered before the web
  release.
- PR CI remains read-only (validate + dry-run).
