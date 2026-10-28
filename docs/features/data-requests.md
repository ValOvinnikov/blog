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
  - apps/platform/src/utils/personal-data-export-csv/**
epics: [5653]
---

# Data requests

## What it does

A SUPERADMIN finds every record still held about a person from their email
address, downloads all of it as one JSON or CSV file, and erases it. It answers a
request for access to or erasure of personal data, including after the person's
account is deleted, when the remaining records are linked only by email.
Whether the platform answers such a request itself, or forwards a site's
subscribers and leads to that site's owner, is a legal decision outside this
page (#5090). The page serves either answer.

## Surfaces and routes

- `/data-requests` in the operator tree, listed in the sidebar as "Data
  requests" for a SUPERADMIN only. Its layout and page both call
  `requireSuperAdmin`, so every other role, and every site owner, gets a 404.
- The page has a search card (one email field, at most 28rem wide), and after
  a search a result card ("Data held for {email}", with the count), a "Reader
  account" card when the address has one (name, email, sign-in methods,
  active sessions, bookmarks) and a table of every match: kind, site
  ("Platform" for a platform-wide record), the stored email ("Stored as a
  hash" for a sign-up block) and when it was recorded ("Not recorded" for an
  account whose email was never verified). The table shows 25 rows a page,
  newest first; a column header sorts by that column (again to reverse it), a
  search box narrows the rows to those whose shown values contain the text,
  and a kind filter offers each kind the lookup found. All of it runs in the
  browser over the lookup's results.
- With no matches the result card says "No data held for this address." and
  nothing else: no table, downloads or "Erase".
- "Download JSON" and "Download CSV" save
  `personal-data-export-<generatedAt>.json` / `.csv` (colons as dashes, no
  milliseconds, e.g. `personal-data-export-2026-10-27T10-29-42Z.csv`), both with
  the same records, the reader account
  included. Each starts with `generatedAt` (ISO time, set on the server),
  `searchedEmail` and `operatorId` (the operator's user id, never their
  email): the JSON as its first keys, the CSV as its first three columns on
  every row. The CSV is one table with a `kind` column (`SUBSCRIBER`, `LEAD`,
  `INVITE`, `READER_ACCOUNT`, `BOOKMARK`, `SIGNUP_BLOCK`, `AUDIT_EVENT`) and
  one column per field, empty where a kind has none; dates are ISO times and
  the sign-in methods a JSON object. It is UTF-8 with a byte-order mark, quotes
  cells per RFC 4180, and prefixes a text cell that starts with `=`, `+`, `-`
  or `@` with `'` so a spreadsheet never runs it. "Erase" opens a confirmation dialog that needs the email typed in
  full. When the address has a reader account the dialog has "Also delete the
  reader account", ticked by default; unticked, the account, its sessions and
  bookmarks are left alone (a narrower request, such as newsletter only). When
  the address has a sign-up block the dialog says it stays. On success it shows
  how many records were erased, and why the reader account was kept if it was
  refused, and clears the results.
- Server Actions: `lookUpPersonalDataAction` and `exportPersonalDataAction`
  take `{ email }`; `erasePersonalDataAction` takes
  `{ email, includesReaderAccount }`. The email travels in the POST body, never
  in a URL.

## Data

- `queries.personalData.findPersonalData(email)` normalises the address (lower
  case, `+tag` dropped), takes its keyed index (`PERSONAL_DATA_INDEX_KEY`), and
  reads:
  - `subscribers`, `leads` and `membership_invites` rows whose `email_index`
    matches, each with its site's id and name, and with the encrypted email,
    lead name and message decrypted (falling back to the plain column while a
    row has no encrypted form);
  - the tenants holding that address as an unsent Studio re-invite
    (`tenants.unsent_reinvite_former_owner_email_encrypted`, from an
    owner-email change whose re-invite failed — see
    [tenant access](./tenant-access.md)). The column has no lookup index, so
    each stored value is decrypted and compared;
  - `blocked_signup_identities` ADDRESS entries whose `value` is that index;
  - the reader account whose address is exactly the one given
    (`findUserByEmail`, which keeps a `+tag` and falls back to the plain
    column for a user with no index): its profile, its linked sign-in methods
    (`getLinkedProviders`, no tokens), its bookmarks on every site and its
    count of unexpired sessions;
  - `audit_events` whose `actor_id` is that account, with no email of their
    own.
- `queries.personalData.erasePersonalData(email, { includesReaderAccount })`
  deletes the matched subscribers, leads and invites, clears the matched
  unsent Studio re-invites and, when asked, the
  reader account through `deleteAccount`: its sessions (so it is signed out
  everywhere), linked sign-ins and bookmarks cascade. It returns how many of
  each it deleted and whether the account was refused. Audit events hold no
  email and keep their history, shown as a deleted account.
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
- Erasure keeps a sign-up block: it holds only the address's keyed hash and
  keeps the address out of sign-up. A repeat lookup still lists it.
- Erasure never deletes an account that owns a site or is an operator
  (`DB_HOLDS_PLATFORM_ROLE` from `deleteAccount`); the site records are still
  erased and the operator is told why the account was kept.
- Account deletion is the same as the reader's own "Delete account"
  ([Reader account](reader-account.md)).

## Dependencies

- `@blog/db` (`findPersonalData`, `erasePersonalData`, `findUserByEmail`,
  `getLinkedProviders`, `deleteAccount`), `@blog/utils`
  (`normalizeEmailIdentity`, `personalDataIndex`, `decryptPersonalData`,
  `toCsv`),
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
- `apps/platform/src/utils/personal-data-export-csv/personal-data-export-csv.test.ts`
- `apps/platform/src/components/features/data-requests/data-request-view/components/data-request-panel/data-request-panel.test.tsx`
- `apps/platform/src/components/features/data-requests/data-request-view/components/data-request-matches-table/data-request-matches-table.test.tsx`
- `apps/platform/src/app/[locale]/(operator)/data-requests/*.test.tsx`

## Related epics

- #5653: personal data at rest.
