import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './auth';

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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (bookmark) => [
    // Composite primary key — one row per (userId, postId), matching the
    // `accounts`/`verification_tokens` pattern already established in
    // auth.ts for a table with no natural single-column key. This is also
    // the acceptance criterion's "unique per user+post" constraint: adding
    // an already-bookmarked pair conflicts here rather than duplicating.
    primaryKey({ columns: [bookmark.userId, bookmark.postId] }),
  ],
);

export type TBookmark = typeof bookmarks.$inferSelect;
