---
title: Data requests
status: built
layers: [db, platform, config]
code:
  - packages/db/src/queries/personal-data/**
  - apps/platform/src/app/[locale]/(operator)/data-requests/**
  - apps/platform/src/server/data-requests/**
  - apps/platform/src/components/features/data-requests/**
  - apps/platform/src/constants/data-request.ts
epics: [5653]
---

# Data requests

## What it does

A SUPERADMIN finds every record still held about a person from their email
address, downloads all of it as one JSON file, and erases it. It answers a
request for access to or erasure of personal data, including after the person's
account is deleted, when the remaining records are linked only by email.
Whether the platform answers such a request itself, or forwards a site's
subscribers and leads to that site's owner, is a legal decision outside this
page (#5090). The page serves either answer.

## Surfaces and routes

- `/data-requests` in the operator tree, listed in the sidebar as "Data
  requests" for a SUPERADMIN only. Its layout and page both call
  `requireSuperAdmin`, so every other role, and every site owner, gets a 404.
- The page has a search card (one email field), and after a search a result
  card ("Data held for {email}", with the count) and a table of every match:
  kind, site ("Platform" for a platform-wide record), the stored email
  ("Stored as a hash" for a sign-up block) and when it was recorded.
- "Download export" saves `personal-data-export.json`. "Erase" opens a
  confirmation dialog that needs the email typed in full. On success it shows
  how many records were erased and clears the results.
- Server Actions: `lookUpPersonalDataAction`, `exportPersonalDataAction` and
  `erasePersonalDataAction`, each taking `{ email }`. The email travels in the
  POST body, never in a URL.

## Data

- `queries.personalData.findPersonalData(email)` normalises the address (lower
  case, `+tag` dropped), takes its keyed index (`PERSONAL_DATA_INDEX_KEY`), and
  reads:
  - `subscribers`, `leads` and `membership_invites` rows whose `email_index`
    matches, each with its site's id and name, and with the encrypted email,
    lead name and message decrypted (falling back to the plain column while a
    row has no encrypted form);
  - `blocked_signup_identities` ADDRESS entries whose `value` is that index;
  - `audit_events` acted by the account whose address is exactly the one
    given (`users.emailIndex`, which keeps a `+tag`), with no email of their
    own.
- `queries.personalData.erasePersonalData(email)` deletes the matched
  subscribers, leads, invites and sign-up block, and returns how many of each
  it deleted. Audit events hold no email and keep their history; the account
  they point at goes through account deletion.
- Both return `TResult`, with `DB_INVALID_EMAIL` for a value that is not an
  email address. Both return the index, so the app can audit without the email.

## Configuration

Nothing is configurable. Both personal-data keys must be set: without
`PERSONAL_DATA_INDEX_KEY` a request fails (logged `data_request.failed`).

## Constraints and invariants

- Only rows with an email index are found. The backfill (#5662) gave every
  existing row one.
- Every lookup, export and erasure is audited as `PERSONAL_DATA_LOOKED_UP`,
  `PERSONAL_DATA_EXPORTED` or `PERSONAL_DATA_ERASED` against target type
  `PERSONAL_DATA`. The `targetId` is the email's index and `details` holds
  only the count per table, never the email.
- An event is recorded only after its read or erasure succeeds.
- Erasure runs one statement per table, without a transaction (`neon-http`).
  Each statement is idempotent, so retrying after a partial failure finishes
  the rest.
- Erasing a sign-up block lifts it: the address can sign up again.
- The search covers only these five tables. A `users` row, its sessions and
  bookmarks go through account deletion ([Reader account](reader-account.md)).

## Dependencies

- `@blog/db` (`findPersonalData`, `erasePersonalData`), `@blog/utils`
  (`normalizeEmailIdentity`, `personalDataIndex`, `decryptPersonalData`),
  `@blog/config` (`AUDIT_ACTION`, `AUDIT_TARGET_TYPE`).
- Features: [tenant-access](./tenant-access.md),
  [audit-and-findings](./audit-and-findings.md),
  [newsletter](./newsletter.md), [contact-form](./contact-form.md).
- Env: `PERSONAL_DATA_ENCRYPTION_KEY`, `PERSONAL_DATA_INDEX_KEY` on the
  platform.

## Entry points

- `apps/platform/src/app/[locale]/(operator)/data-requests/page.tsx`
- `apps/platform/src/server/data-requests/run-data-request.ts`
- `apps/platform/src/components/features/data-requests/data-request-view/data-request-view.tsx`
- `packages/db/src/queries/personal-data/find-personal-data/find-personal-data.ts`
- `packages/db/src/queries/personal-data/erase-personal-data/erase-personal-data.ts`

## Tests and stories

- `packages/db/src/queries/personal-data/*/*.test.ts`
- `apps/platform/src/server/data-requests/*.test.ts`
- `apps/platform/src/components/features/data-requests/data-request-view/components/data-request-panel/data-request-panel.test.tsx`
- `apps/platform/src/app/[locale]/(operator)/data-requests/*.test.tsx`

## Related epics

- #5653: personal data at rest.
