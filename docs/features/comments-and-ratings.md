---
title: Comments and ratings
status: planned
layers: [config, db, ui, web, platform, studio]
code:
  - packages/config/src/constants/capability.ts
  - packages/db/src/schema/settings-features.ts
  - apps/platform/src/utils/settings-features-fields/settings-features-fields.ts
  - apps/platform/src/utils/nav-sections/nav-sections.ts
  - apps/platform/src/utils/plan-page-access/plan-page-access.ts
  - apps/web/src/server/settings-features/is-reader-account-enabled/**
epics: [1040, 1041]
---

# Comments and ratings

## What it does

Signed-in readers will be able to leave threaded comments on a post and give it a 1–5 rating, one per reader per post. New comments wait for moderation before they show. Neither feature exists on the public site today: only the capability switches, the plan entitlement and a "Coming soon" admin entry are in place. Switching them on renders no comment or rating UI, though `COMMENTS` already opens the reader account surfaces (see Constraints).

## Surfaces and routes

- **Public site** — nothing yet. The planned shape is an engagement island on the post page, mounted as a client component so the article itself stays statically rendered.
- **Platform, Features page** — `/dashboard/features` and `/tenants/{id}/features` show Comments and Ratings as read-only "Coming soon" rows with no switch.
- **Platform, sidebar** — a Comments entry with a "Coming soon" badge and no page, shown when the plan holds `COMMENTS` (operators always see it).
- **Studio** — nothing. Neither capability maps to a module type, so the "(off in Features)" relabel never applies to them.

## Data

- `CAPABILITY.COMMENTS` and `CAPABILITY.RATINGS` in `@blog/config`.
- `settings_features.comments_enabled` and `ratings_enabled` — `NOT NULL`, default `true`. Both presets' `featureDefaults` turn them on.
- No `comments` or `ratings` table exists. The decided shapes:
  - `comments` — `tenantId` (foreign key to `tenants`; every query scoped by it), `postId` as the Sanity `_id` string (a cross-store reference, not a foreign key), `userId`, plain-text `body`, `status` (pending, approved, spam), nullable `parentId` for threads, timestamps and a soft-delete flag.
  - `ratings` — `tenantId` (foreign key to `tenants`), `userId`, `postId`, unique together as `(tenantId, userId, postId)`, `value` 1–5 (a vote is an upsert); the summary is a SQL average and count.
- The rating aggregate is to be cached under a tag and expired on each write.

## Configuration

- **Plan** — `PLAN_REGISTRY` gives `RATINGS` to `FREE` and `GROWTH`, `COMMENTS` to `GROWTH` only (comments make readers sign in and carry moderation cost).
- **Owner or operator** — no one can switch either on: `isComingSoon` in `CAPABILITY_TOGGLES` renders the row read-only and every save, an operator's included, writes both off whatever the payload says. Shipping either feature means dropping that flag.
- **Platform pages** — `planPageAccess` opens Comments and counts `COMMENTS` toward the Email page; the Comments page does not exist yet (its sidebar entry has no link).
- **Voice** — no copy exists. New public strings get classified Voice or fixed when the work is planned.

## Constraints and invariants

- Comments need a reader session; ratings need one too. Logged-out readers can do neither.
- New comments default to pending; only approved comments render.
- One rating per user per post, enforced by the database, not the app.
- The post page stays statically generated; only the island is dynamic.
- Account export and deletion must cover both tables when they ship. A deleted reader's comments are tombstoned, not cascade-deleted, so a thread keeps its shape.
- The coming-soon clamp lives only in the platform's save path. `apps/web` knows nothing of it: a tenant with no `settings_features` row falls back to its preset's defaults, so a `GROWTH` tenant resolves both capabilities on and a `FREE` tenant resolves `RATINGS` on. That is harmless only because no render site exists, so a comment or rating island must not ship before its `isComingSoon` flag is dropped deliberately.
- `COMMENTS` already counts toward `isReaderAccountEnabled`, which opens `/account`, `/bookmarks` and the header account menu.

## Dependencies

- Layers: `db` (tables, queries), `ui` (pure comment and rating components), `web` (islands, route handlers), `platform` (moderation, toggles).
- Features: ./reader-auth.md, ./reader-account.md, ./plans-and-entitlements.md, ./posts.md, ./bookmarks.md (the built sibling engagement feature), ./email.md.
- Env vars: none of its own; reader sign-in uses the `AUTH_*` set.

## Entry points

- `packages/config/src/constants/capability.ts`
- `packages/db/src/constants/tenant.ts` (`PLAN_REGISTRY`)
- `packages/db/src/schema/settings-features.ts`
- `apps/platform/src/utils/settings-features-fields/settings-features-fields.ts`
- `apps/platform/src/utils/nav-sections/nav-sections.ts`
- `apps/web/src/server/settings-features/is-reader-account-enabled/is-reader-account-enabled.ts`

## Tests and stories

No feature tests or stories exist. The capability wiring is covered by `settings-features-fields.test.ts`, `nav-sections.test.ts`, `plan-page-access.test.ts` (platform) and `is-reader-account-enabled.test.ts`, `to-effective-settings-features.test.ts` (web).

## Related

- #1040 — threaded comments epic; sub-issues #1094 (db), #1095 (ui), #1096 (web island and route), #1097 (moderation queue).
- #1041 — post ratings epic; sub-issues #1098 (db), #1099 (ui), #1100 (web island and route).
