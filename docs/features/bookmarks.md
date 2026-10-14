---
title: Bookmarks
status: built
layers: [db, service, ui, web]
code:
  - packages/db/src/schema/bookmarks.ts
  - packages/db/src/queries/bookmarks/**
  - apps/web/src/server/bookmarks/**
  - apps/web/src/components/shared/bookmark-button/**
  - apps/web/src/components/features/post/bookmark-button-gate/**
  - apps/web/src/components/pages/bookmarks-page/**
  - apps/web/src/app/[tenant]/[locale]/bookmarks/**
  - apps/web/src/metadata/bookmarks-metadata/**
  - apps/web/src/testing/pages/bookmarks-page/**
  - packages/ui/src/components/atoms/bookmark-toggle/**
epics: [5047, 2799]
---

# Bookmarks

## What it does

A signed-in reader saves a post for later with a toggle in the post header and finds every saved post on `/bookmarks`, newest first. A bookmark is private: there is no public count and nobody else sees it. Saving and removing give a toast with Undo; a failed save offers Retry.

## Surfaces and routes

- **Post page** — `BookmarkButtonGate` in the article header renders `BookmarkButton` when the `BOOKMARKS` capability is on. The button renders nothing for a signed-out reader and stays disabled until the session and the post's saved state have loaded.
- `/[locale]/bookmarks` — `force-dynamic`. 404 when the site has no reader account; a signed-out visitor is redirected home. Lists title, date and link per post, with an empty state when there are none.
- **Header avatar menu** — "My bookmarks" links here (see [reader-auth](./reader-auth.md)).
- No platform or Studio surface.

## Data

- Neon `bookmarks`: `tenant_id` (FK `tenants`, cascade), `user_id` (FK `users`, cascade), `post_id` (a Sanity document `_id` as plain text, no FK), `created_at`. Primary key (`tenant_id`, `user_id`, `post_id`).
- `/bookmarks` lists the rows, resolves them to posts through `service.entities.posts.v1.getPostsByIds` in one call and keeps the bookmark order. A bookmark whose post no longer resolves is dropped from the list.
- Deleting a post in Sanity: the revalidation webhook (`POST /api/revalidate`, a `delete` operation on a post) removes that post's bookmarks for the tenant.
- Deprovisioning a tenant purges its bookmarks; deleting a reader's account cascades theirs.
- Nothing is cached; reads hit Neon per request.

## Configuration

- **Owner or operator (platform Features)** — the `BOOKMARKS` toggle, which only `GROWTH` includes.
- **Voice** — the `/bookmarks` empty state (`bookmarksEmpty`, path `bookmarksPage.empty`) is tenant-editable. The button labels, toasts and page title are fixed (`bookmarkButton.*`, `bookmarksPage.*`).
- **Look** — `BookmarkToggle` and the page follow the site's Look.

## Constraints and invariants

- `tenant_id` is part of the key because a post `_id` is unique only within one tenant's dataset, and a reader is a global identity.
- Server actions read the session themselves; a client never supplies the user id.
- `setBookmarkStatus` writes only through `resolveWritableTenant`: an inactive or deprovisioned tenant refuses with an "unavailable" result, which shows its own no-retry toast.
- `addBookmark` is idempotent (`onConflictDoNothing`), and removing a missing bookmark is a no-op.
- The button gates on `BOOKMARKS`, but `/bookmarks` gates on any reader capability (bookmarks, comments or newsletter), so with bookmarks off and another reader feature on the page still answers. That state is reachable only through a stored `settings_features` row written before comments and newsletter were locked as Coming soon: every Features save writes both off, and with no stored row Bookmarks defaults on.
- A capability switched off hides the button and keeps the stored rows.

## Dependencies

- Layers: `db`, `service` (posts by id), `ui` (`BookmarkToggle`), `web`.
- Features: [reader-auth](./reader-auth.md), [reader-account](./reader-account.md) (export includes this tenant's bookmarks), [posts](./posts.md), [toasts](./toasts.md), [plans-and-entitlements](./plans-and-entitlements.md), [voice](./voice.md), [rendering-and-caching](./rendering-and-caching.md) (the revalidation webhook), [tenant-provisioning](./tenant-provisioning.md).
- Env: `DATABASE_URL`, plus [reader-auth](./reader-auth.md)'s.

## Entry points

- `packages/db/src/schema/bookmarks.ts`
- `packages/db/src/queries/bookmarks/` — `addBookmark`, `removeBookmark`, `isBookmarked`, `listBookmarks`, `removeBookmarksForPost`, `countBookmarksForTenant`, `deleteBookmarksForTenant`
- `apps/web/src/server/bookmarks/bookmark-actions/bookmark-actions.ts` — `getBookmarkStatus`, `setBookmarkStatus`
- `apps/web/src/components/shared/bookmark-button/bookmark-button.tsx`
- `apps/web/src/components/features/post/bookmark-button-gate/bookmark-button-gate.tsx`
- `apps/web/src/components/pages/bookmarks-page/bookmarks-page.tsx`
- `apps/web/src/app/api/revalidate/route.ts` — post-delete cleanup

## Tests and stories

- `packages/db/src/queries/bookmarks/**/*.test.ts`, plus the schema migration tests beside `packages/db/src/schema/bookmarks.ts`.
- `apps/web/src/server/bookmarks/**/*.test.ts`, `bookmark-button.test.tsx`, `bookmark-button-gate.test.tsx`, `apps/web/src/components/pages/bookmarks-page/*.test.tsx`, `apps/web/src/app/[tenant]/[locale]/bookmarks/page.test.tsx`.
- Stories: `bookmarks-page-view.stories.tsx` (web), `bookmark-toggle.stories.tsx` (ui).

## Related

- #2799 — continue reading: bookmarked posts on the home page for signed-in readers.
- #5047 — epic: plans and entitlements (downgrade keeps stored data; reader self-service on Free).
