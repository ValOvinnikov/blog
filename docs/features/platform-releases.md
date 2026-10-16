---
title: Platform releases
status: planned
layers: [config, utils]
code:
  - packages/config/src/constants/release.ts
  - packages/config/src/constants/audit.ts
  - packages/config/src/constants/finding.ts
  - packages/config/src/types/contrast-result.ts
  - packages/utils/src/version/**
epics: [5271]
---

# Platform releases

## What it does

A SUPERADMIN will see the release candidate on a platform Releases page,
run the contrast check and cut a production release from it. None of the page
is built yet. What exists is the shared vocabulary the page, the contrast
ingest route and the release workflow will use.

## Surfaces and routes

None yet.

## Data

No table of its own. Releases reuse two existing records, both storing these
values as plain `text`, so none of them needs a db migration:

- `audit_events`: `RELEASE_STARTED`, `RELEASE_OVERRIDE` and
  `CONTRAST_CHECK_STARTED` on the `RELEASE` target type, whose `targetId` is
  the version or commit SHA. `TENANT_MIGRATIONS_STARTED` targets the tenant.
- `findings`: source `CONTRAST_CHECK`, kind `CONTRAST_REGRESSION`.

## Configuration

- `RELEASE_WATCHED_PATHS` (`@blog/config`) maps each `RELEASE_CHANGE`
  (`RENDERING`, `DB_MIGRATION`, `SANITY_MIGRATION`, `ENV`) to the path
  prefixes that count as that kind of change.
- `TContrastResultBody` (`@blog/config`) is the body the contrast workflow
  posts and the ingest route validates: `sha`, `outcome` (`PASS` or `FAIL`),
  `failureCount`, `runUrl` and an optional `tag`.

## Constraints and invariants

- The `RENDERING` prefixes match the contrast workflow's scope
  (`packages/ui`, `apps/web`, `packages/config/src/theme`,
  `configs/tailwind`), so a change outside them never makes a contrast run
  due.
- A release version is exactly `vMAJOR.MINOR.PATCH` with no leading zeros,
  and versions order numerically (`v0.10.0` is greater than `v0.9.0`).

## Dependencies

- [Audit events and findings](audit-and-findings.md) — the two records
  releases write to.

## Entry points

- `parseReleaseVersion` and `isReleaseVersionGreater` (`@blog/utils/version`).

## Tests and stories

- `packages/utils/src/version/release-version.test.ts`.

## Related

- Epic #5271.
