---
title: Comments and ratings
status: planned
layers: [config, db, ui, web, platform, studio]
code:
  - packages/config/src/constants/capability.ts
  - packages/db/src/schema/settings-features.ts
  - apps/platform/src/utils/settings-features-fields/settings-features-fields.ts
  - apps/platform/src/utils/plan-page-access/plan-page-access.ts
  - apps/web/src/server/settings-features/is-reader-account-enabled/**
epics: [1040, 1041]
---

# Comments and ratings

## What it does

Signed-in readers will be able to leave threaded comments on a post and give it a 1–5 rating, one per reader per post. New comments wait for moderation before they show. Neither feature exists on the public site today: only the stored toggles and the plan entitlement are in place, and the platform shows neither. Switching them on renders no comment or rating UI, though `COMMENTS` already opens the reader account surfaces (see Constraints).

## Surfaces and routes

- **Public site** — nothing yet. The planned shape is an engagement island on the post page, mounted as a client component so the article itself stays statically rendered.
- **Platform, Features page** — `/dashboard/features` and `/tenants/{id}/features` show no Comments or Ratings row on any plan; the save always writes both off. Ratings are dropped; Comments are hidden until built.
- **Platform, sidebar** — no Comments entry.
- **Studio** — nothing. Neither capability maps to a module type, so the "(off in Features)" relabel never applies to them.

## Data

- `CAPABILITY.COMMENTS` and `CAPABILITY.RATINGS` in `@blog/config`.
- `settings_features.comments_enabled` and `ratings_enabled` — `NOT NULL`, default `false`. Both presets' `featureDefaults` leave them off.
- No `comments` or `ratings` table exists. The decided shapes:
  - `comments` — `tenantId` (foreign key to `tenants`; every query scoped by it), `postId` as the Sanity `_id` string (a cross-store reference, not a foreign key), `userId`, plain-text `body`, `status` (pending, approved, spam), nullable `parentId` for threads, timestamps and a soft-delete flag.
  - `ratings` — `tenantId` (foreign key to `tenants`), `userId`, `postId`, unique together as `(tenantId, userId, postId)`, `value` 1–5 (a vote is an upsert); the summary is a SQL average and count.
- The rating aggregate is to be cached under a tag and expired on each write.

## Configuration

- **Plan** — `PLAN_REGISTRY` gives `COMMENTS` and `RATINGS` to `GROWTH` only: both make readers sign in, and comments carry moderation cost.
- **Reader accounts** — both sit under the `READER_ACCOUNTS` switch on Features and stop applying while it is off.
- **Owner or operator** — no one can see or switch either: `HIDDEN_CAPABILITIES` leaves both out of `SHOWN_CAPABILITY_TOGGLES`, and `isComingSoon` in `CAPABILITY_TOGGLES` makes every save, an operator's included, write both off whatever the payload says. Shipping Comments means taking it off `HIDDEN_CAPABILITIES` and dropping that flag.
- **Platform pages** — `planPageAccess` counts `COMMENTS` toward the Email page; there is no Comments page.
- **Voice** — no copy exists. New public strings get classified Voice or fixed when the work is planned.

## Constraints and invariants

- Comments need a reader session; ratings need one too. Logged-out readers can do neither.
- New comments default to pending; only approved comments render.
- One rating per user per post, enforced by the database, not the app.
- The post page stays statically generated; only the island is dynamic.
- Account export and deletion must cover both tables when they ship. A deleted reader's comments are tombstoned, not cascade-deleted, so a thread keeps its shape.
- Both capabilities are on `COMING_SOON_CAPABILITIES` (`@blog/config`), the list both apps read, and on the platform's own `HIDDEN_CAPABILITIES`, which keeps their Features rows out; taking a capability off both is the deliberate step that ships it. The platform's Features save writes every `COMING_SOON_CAPABILITIES` entry off, and `apps/web` leaves listed capabilities out of `isReaderAccountEnabled`. A tenant with no `settings_features` row still falls back to its preset's defaults, so a `GROWTH` tenant resolves both capabilities on and a `FREE` tenant resolves `RATINGS` on; that is harmless only because no render site exists, so a comment or rating island must not ship while its capability is still on the list.
- Comments and Ratings are nested under Reader accounts: once built, each applies only while `READER_ACCOUNTS` is on too (`isReaderAccountFeatureEnabled`). Neither decides whether a site offers sign-in.

## Dependencies

- Layers: `db` (tables, queries), `ui` (pure comment and rating components), `web` (islands, route handlers), `platform` (moderation, toggles).
- Features: ./reader-auth.md, ./reader-account.md, ./plans-and-entitlements.md, ./posts.md, ./bookmarks.md (the built sibling engagement feature), ./email.md.
- Env vars: none of its own; reader sign-in uses the `AUTH_*` set.

## Entry points

- `packages/config/src/constants/capability.ts`
- `packages/db/src/constants/tenant.ts` (`PLAN_REGISTRY`)
- `packages/db/src/schema/settings-features.ts`
- `apps/platform/src/utils/settings-features-fields/settings-features-fields.ts`
- `apps/web/src/server/settings-features/is-reader-account-enabled/is-reader-account-enabled.ts`

## Tests and stories

No feature tests or stories exist. The capability wiring is covered by `settings-features-fields.test.ts`, `features-settings.test.tsx`, `plan-page-access.test.ts` (platform) and `is-reader-account-enabled.test.ts`, `to-effective-settings-features.test.ts` (web).

## Related

- #1040 — threaded comments epic; sub-issues #1094 (db), #1095 (ui), #1096 (web island and route), #1097 (moderation queue).
- #1041 — post ratings epic; sub-issues #1098 (db), #1099 (ui), #1100 (web island and route).
