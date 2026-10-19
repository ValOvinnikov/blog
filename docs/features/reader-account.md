---
title: Reader account
status: built
layers: [db, web, ui]
code:
  - apps/web/src/app/[tenant]/[locale]/account/**
  - apps/web/src/app/api/account/**
  - apps/web/src/components/pages/account-page/**
  - apps/web/src/components/shared/delete-account-control/**
  - apps/web/src/components/shared/display-name-control/**
  - apps/web/src/components/shared/provider-link-control/**
  - apps/web/src/server/account/**
  - apps/web/src/server/settings-features/is-reader-account-enabled/**
  - apps/web/src/metadata/account-metadata/**
  - apps/web/src/testing/pages/account-page/**
  - packages/db/src/queries/account/**
epics: [5047, 4979, 1040, 1041]
---

# Reader account

## What it does

A signed-in reader manages their own account at `/account`: edit the display name, link or unlink GitHub and Google, manage an existing newsletter subscription, download their data as JSON, and delete the account. Reader accounts exist on a site only while at least one of bookmarks, comments or newsletter is enabled for it; otherwise the account pages answer 404 and the header offers no sign-in.

## Surfaces and routes

- `/[locale]/account` — `force-dynamic`. 404 when the site has no reader account; a signed-out visitor is redirected home.
  - **Identity** — rows for GitHub, Google and email link with their linked status; Link / Unlink controls for the two OAuth providers; a display-name field.
  - **Newsletter** — shown only when the reader's email has a subscriber row on this tenant: Unsubscribe when active, Resend confirmation when pending (see [newsletter](./newsletter.md)).
  - **Privacy** — "Export my data" and a typed-confirm delete (the reader types their handle to arm the danger button).
- `GET /api/account/export` — downloads `account-data.json`. 401 without a session, 404 when the tenant or user is unknown.
- The header avatar menu links to `/account` and `/bookmarks` (see [reader-auth](./reader-auth.md)).

## Data

- Neon: `users` (`name`, `email`, `emailVerified`, `image`), `accounts` (one row per linked OAuth provider), `bookmarks`, `subscribers`.
- The email-link method has no `accounts` row; it counts as linked when `users.emailVerified` is set.
- Export: the profile (`users` row) plus this tenant's bookmarks (`postId`, `createdAt`), newest first.
- Delete: removes the `users` row; `accounts`, `sessions`, `bookmarks` (on every tenant) and non-owner `memberships` cascade, and `admins.granted_by` pointing at the user is set to NULL. `subscribers` rows are keyed by email, not user, and stay. A user holding an OWNER membership or an `admins` row is refused (`DB_HOLDS_PLATFORM_ROLE` → `BLOCKED`) and nothing is deleted; the control shows its own message for that.
- Nothing is cached.

## Configuration

- **Owner or operator (platform Features)** — bookmarks, comments and newsletter together decide whether reader accounts exist (`isReaderAccountEnabled`). Only Bookmarks is switchable: comments and newsletter are Coming soon and every Features save writes them off, so they count only through the preset default (`COMMENTS` on) when no `settings_features` row is stored, or through a stored row that predates the lock. On `FREE` none of the three is in the plan, so a `FREE` site has no reader accounts.
- **Voice** — none; account copy is fixed (`accountPage.*`).
- **Look** — the page renders through `@blog/ui` primitives (`Panel`, `SettingRow`) and follows the site's Look.

## Constraints and invariants

- Every server write reads the session itself and never takes a user id from the client. The `db` account queries do no authorization of their own and act on whatever id they are given.
- `unlinkProviderAction` re-validates the provider at runtime. `unlinkProvider` refuses to remove the last remaining sign-in method, counting OAuth rows plus `emailVerified`, in one locking SQL statement so two concurrent unlinks cannot both pass.
- Email link cannot be unlinked.
- Linking runs `signIn(provider)` while signed in, which Auth.js links to the current user, and returns to `/account`.
- The display name is trimmed and an empty name is refused.
- The typed confirmation is a client-side guard; the server action requires only a session. Only a successful delete signs the reader out.
- Export and delete are ungated by capability, but `/account` itself is not, so a reader on a site whose reader features are off cannot reach them there.
- One `users` row serves every tenant and the platform: deleting on one site deletes the identity everywhere, which the delete description states. `deleteAccount` refuses a tenant owner or platform admin in the same statement as the delete, so no deletion from a site leaves a tenant without an owner or the platform without its admins.

## Dependencies

- Layers: `db` (account, subscriber and bookmark queries), `web`, `ui` (`Panel`, `SettingRow`, `TextInput`, `Button`, `LinkButton`).
- Features: [reader-auth](./reader-auth.md), [bookmarks](./bookmarks.md), [newsletter](./newsletter.md), [plans-and-entitlements](./plans-and-entitlements.md), [toasts](./toasts.md), [multi-tenancy](./multi-tenancy.md).
- Env: as [reader-auth](./reader-auth.md).

## Entry points

- `apps/web/src/app/[tenant]/[locale]/account/page.tsx`
- `apps/web/src/components/pages/account-page/account-page.tsx`
- `apps/web/src/components/pages/account-page/sections/identity-section/identity-section.tsx`
- `apps/web/src/components/pages/account-page/sections/privacy-section/privacy-section.tsx`
- `apps/web/src/server/account/identity-actions/identity-actions.ts`
- `apps/web/src/server/account/account-actions/account-actions.ts`
- `apps/web/src/app/api/account/export/route.ts`
- `apps/web/src/server/settings-features/is-reader-account-enabled/is-reader-account-enabled.ts`
- `packages/db/src/queries/account/` — `deleteAccount`, `exportAccountData`, `getLinkedProviders`, `unlinkProvider`, `updateDisplayName`

## Tests and stories

- `apps/web/src/components/pages/account-page/**/*.test.tsx`, `apps/web/src/server/account/**/*.test.ts`, `apps/web/src/app/api/account/export/route.test.ts`, `apps/web/src/app/[tenant]/[locale]/account/page.test.tsx`, and the controls' own tests.
- `packages/db/src/queries/account/**/*.test.ts`.
- Story: `apps/web/src/components/pages/account-page/account-page-view.stories.tsx`; fixtures in `apps/web/src/testing/pages/account-page/`.

## Related

- #5047 — epic: plans and entitlements. Its "What Free keeps" decision settles #5062 (export and delete for signed-in readers on a site without reader features) and #5063.
- #4979 — epic: web and platform stay separate. #4984 refuses deleting an account that owns a site or runs the platform.
- #1040, #1041 — comments and ratings; each extends the export and delete when it ships.
