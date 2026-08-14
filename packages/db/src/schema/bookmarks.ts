import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './auth';
import { tenants } from './tenants';

// Feature 4 (#1043) — private "save for later" rows. Per the accepted design
// decision (docs/superpowers/specs/2026-08-03-engagement-ui-design.md,
// Feature 4 / Decision D6: bookmarks only, not likes — ratings (#1041)
// already own the public appreciation signal), a bookmark is a private
// (userId, postId) pair with no public count.
//
// `postId` holds a Sanity document `_id` as plain text, not a Postgres FK —
// posts live in Sanity, not this database (see .claude/agents/db.md and
// SPEC.md §4). `userId` is a real FK into the Auth.js adapter's `users`
// table (auth.ts), cascading on delete like `accounts`/`sessions` there.
export const bookmarks = pgTable(
  'bookmarks',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (bookmark) => [
    // Composite primary key includes tenantId, not just (userId, postId):
    // `postId` is a Sanity document `_id`, only unique within one tenant's
    // own dataset (each tenant has its own `sanityProjectId`/`sanityDataset`
    // — see tenants.ts), so two different tenants' posts can share the same
    // `_id`. Without tenantId here, a bookmark on tenant A's post could
    // collide with an unrelated post on tenant B that happens to share an
    // `_id`, or block a user with memberships on both tenants from
    // bookmarking both. `userId` alone doesn't rule this out either — Auth.js
    // users are global identities, not tenant-scoped.
    primaryKey({
      columns: [bookmark.tenantId, bookmark.userId, bookmark.postId],
    }),
  ],
);

export type TBookmark = typeof bookmarks.$inferSelect;
