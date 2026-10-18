---
title: Platform releases
status: partial
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
  - apps/platform/src/app/[locale]/(operator)/releases/**
  - apps/platform/src/components/features/releases/**
  - apps/platform/src/app/api/internal/contrast-result/**
  - apps/platform/src/server/internal-api/**
epics: [5271]
---

# Platform releases

## What it does

A SUPERADMIN sees the release candidate on the platform Releases page and
runs the contrast check from it. Cutting a production release from the page is
not built yet. What exists is the shared vocabulary, the server-side reader that
works out the release candidate from GitHub and the database, the signed
route the contrast workflow posts its result to, the page and the contrast
Server Action.

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

- `/releases` (`(operator)` group) — SUPERADMIN only. `releases/layout.tsx`
  and the page both call `requireSuperAdmin`, so an ADMIN or MODERATOR gets
  the same 404 as a missing page, and the Platform nav lists Releases for a
  SUPERADMIN only (`operatorNavSections(t, role)`). The page shows:
  - the last tag, the latest commit and the count of commits since the tag;
  - the commits table (short sha, first line of the message, author, date),
    with a note "showing the newest N of M" when fewer commits are listed
    than `totalCommits`;
  - the touched areas (UI and rendering, database migrations, Sanity
    migrations, environment variables), each Touched or Not touched, with the
    migration counts beside the two migration areas. When
    `migrations.isLowerBound` is set each count reads "At least N";
  - a warning that the change list is incomplete when `isFileListTruncated`
    is set (GitHub lists at most 300 files);
  - the contrast status badge with a one-line explanation, a link to
    `/findings` when it is `FAILED`, and the Run contrast check button.
  - When there are no commits since the tag only the summary and an empty
    message show. A failed read shows an error notice with the reason and a
    Try again button, never earlier data. Loading is the `(operator)`
    segment's page skeleton.
- Server Action `startContrastCheckAction`
  (`server/releases/start-contrast-check-action.ts`): `requireSuperAdmin`,
  reads `main`'s HEAD, answers `BLOCKED` when a `contrast.yml` run for it is
  already active and `UNAVAILABLE` when GitHub cannot be read, dispatches
  `contrast.yml` on `main` through `dispatchGitHubWorkflow` (`SERVER_ERROR`
  when that fails), then records `CONTRAST_CHECK_STARTED` on the `RELEASE`
  target with the HEAD sha as `targetId`. The event attests the dispatch
  request, not the workflow's outcome, and is written only after a successful
  dispatch. The button is disabled while the status is `RUNNING` and after a
  start until the page reloads; GitHub can take a moment to list the new run,
  so the status can lag the click.
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
  (logged at warn), `githubError`, `tagListIncomplete` and `dbError`. A repository with no tag yet
  is not logged.
- The reader pages GitHub's lists 100 at a time: a comparison's changed files
  up to GitHub's 300-file limit, the pages holding its newest commits, and
  every `v*` tag ref up to 10 pages (1000 tags). Every request keeps its
  timeout, and a failed page fails the read with a reason code. A tag list
  still full at the page cap is reported as `tagListIncomplete`, never as a
  different latest tag.
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
- `startContrastCheckAction` (`apps/platform/src/server/releases/`).
- `ReleasesView` (`apps/platform/src/components/features/releases/`).

## Tests and stories

- `packages/utils/src/version/release-version.test.ts`.
- `apps/platform/src/app/api/internal/contrast-result/route.test.ts`.
- `apps/platform/src/app/[locale]/(operator)/releases/*.test.tsx` and
  `apps/platform/src/components/features/releases/**/*.test.tsx`.
- `apps/platform/src/server/releases/*.test.ts` and
  `apps/platform/src/server/github/*.test.ts`, against a stubbed GitHub.
- `packages/db/src/queries/migrations/**/*.test.ts`.

## Related

- Epic #5271.
- Console step (human): set `CONTRAST_RESULT_SECRET` byte-identically in the
  `platform-dev` Vercel project and the `development` GitHub Environment, and
  a fresh value in `platform-prod` and `Production`.
