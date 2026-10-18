---
title: Platform releases
status: planned
layers: [config, utils, db, platform-app]
code:
  - packages/config/src/constants/release.ts
  - packages/config/src/constants/audit.ts
  - packages/config/src/constants/finding.ts
  - packages/config/src/types/contrast-result.ts
  - packages/utils/src/version/**
  - packages/db/src/queries/migrations/**
  - apps/platform/src/server/github/**
  - apps/platform/src/server/releases/**
  - apps/platform/src/constants/release.ts
  - apps/platform/src/app/api/internal/contrast-result/**
epics: [5271]
---

# Platform releases

## What it does

A SUPERADMIN will see the release candidate on a platform Releases page,
run the contrast check and cut a production release from it. The page is not
built yet. What exists is the shared vocabulary, the server-side reader that
works out the release candidate from GitHub and the database, and the signed
route the contrast workflow posts its result to.

The candidate is `main`'s HEAD measured against the greatest `vX.Y.Z` tag:

- the commits since that tag, newest first: at most the newest 100, with the
  total count beside them (none when HEAD is the tag);
- which `RELEASE_CHANGE` sets the changed files touch;
- the migration summary: content migration folders added under
  `packages/studio/migrations`, the active, non-deprovisioned tenants plus the
  console project they run across, and the `packages/db/migrations` files added
  that the applied journal does not hold yet. A tenant whose own ledger lags
  further behind is not read, so its figure is a lower bound. A truncated file
  list marks every count as a minimum (`isLowerBound`);
- the contrast status: `GREEN` or `FAILED` from the stored result for HEAD,
  `RUNNING` while a `contrast.yml` run for HEAD is in progress, `DUE` when the
  candidate touches a rendering path and one changed since the last green run
  (or none has ever passed), and `NONE` otherwise.

## Surfaces and routes

- `POST /api/internal/contrast-result` — machine-only, Bearer
  `CONTRAST_RESULT_SECRET`. Records the posted result as the SHA's contrast
  finding through `queries.findings.recordContrastResult`: a `FAIL` opens or
  refreshes it, a `PASS` resolves it, which is what the candidate reader's
  contrast status then reports for that SHA.

## Data

No table of its own. Releases reuse two existing records, both storing these
values as plain `text`, so none of them needs a db migration:

- `audit_events`: `RELEASE_STARTED`, `RELEASE_OVERRIDE` and
  `CONTRAST_CHECK_STARTED` on the `RELEASE` target type, whose `targetId` is
  the version or commit SHA. `TENANT_MIGRATIONS_STARTED` targets the tenant.
- `findings`: source `CONTRAST_CHECK`, kind `CONTRAST_REGRESSION`.

## Configuration

- `CONTRAST_RESULT_SECRET` (platform env) — the ingest route's shared
  secret; see `docs/context/environment-variables.md`.
- `RELEASE_WATCHED_PATHS` (`@blog/config`) maps each `RELEASE_CHANGE`
  (`RENDERING`, `DB_MIGRATION`, `SANITY_MIGRATION`, `ENV`) to the path
  prefixes that count as that kind of change.
- `TContrastResultBody` (`@blog/config`) is the body the contrast workflow
  posts and the ingest route validates: `sha`, `outcome` (`PASS` or `FAIL`),
  `failureCount`, `runUrl` and an optional `tag`.

## Constraints and invariants

- The contrast-result route answers 500 when `CONTRAST_RESULT_SECRET` is
  unset (logged `contrast_result.secret_missing`), so it never runs
  unauthenticated; 401 for a missing or wrong token (constant-time
  `isSecretMatch`), recording nothing; 400 for a body that is not JSON or
  fails the schema (a 40-character lowercase hex `sha`, `PASS`/`FAIL`, a
  non-negative integer `failureCount`, a URL `runUrl`); 500 when the write
  fails (logged `contrast_result.record_failed`); and 200 once recorded.
- The `RENDERING` prefixes match the contrast workflow's scope
  (`packages/ui`, `apps/web`, `packages/config/src/theme`,
  `configs/tailwind`), so a change outside them never makes a contrast run
  due.
- The candidate reader never throws. A failure is a reason code:
  `notConfigured` (token or repo missing), `noReleaseTag`, `rateLimited`
  (logged at warn), `githubError` and `dbError`. A repository with no tag yet
  is not logged.
- The reader pages GitHub's lists 100 at a time: a comparison's changed files
  up to GitHub's 300-file limit, the pages holding its newest commits, and
  every `v*` tag ref. Every request keeps its timeout, and a failed page fails
  the read with a reason code.
- At the 300-file limit the file list is truncated (`isFileListTruncated` on
  the candidate): it counts as touching every set, so a rendering change is
  never missed, and the migration counts are minimums.
- A release version is exactly `vMAJOR.MINOR.PATCH` with no leading zeros,
  and versions order numerically (`v0.10.0` is greater than `v0.9.0`).

## Dependencies

- [Audit events and findings](audit-and-findings.md) — the two records
  releases write to; the contrast status reads the contrast finding for a SHA
  and the newest passing SHA.
- GitHub's REST API (tags, branches, compare, contents, workflow runs) through
  the existing `TENANT_PROVISIONING_GITHUB_TOKEN` and
  `TENANT_PROVISIONING_GITHUB_REPO`.
- `drizzle.__drizzle_migrations`, drizzle-kit's applied journal, read by
  `queries.migrations.listAppliedMigrationTimestamps`.

## Entry points

- `parseReleaseVersion` and `isReleaseVersionGreater` (`@blog/utils/version`).
- `getReleaseCandidate` (`apps/platform/src/server/releases/`).

## Tests and stories

- `packages/utils/src/version/release-version.test.ts`.
- `apps/platform/src/app/api/internal/contrast-result/route.test.ts`.
- `apps/platform/src/server/releases/*.test.ts` and
  `apps/platform/src/server/github/*.test.ts`, against a stubbed GitHub.
- `packages/db/src/queries/migrations/**/*.test.ts`.

## Related

- Epic #5271.
- Console step (human): set `CONTRAST_RESULT_SECRET` byte-identically in the
  `platform-dev` Vercel project and the `development` GitHub Environment, and
  a fresh value in `platform-prod` and `Production`.
