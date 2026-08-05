import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Feature 5 (#1044) — newsletter double opt-in (design doc's Decision D9). A
// subscriber is a standalone email subscription, not scoped to a signed-in
// `users` row (per the design doc, a signed-out reader can subscribe) — so
// unlike `bookmarks.ts` there is no `userId` FK here at all, real or logical.
//
// One row per email address, ever: `email` is unique, and `status` moves
// `pending` → `active` in place on that same row (see
// `queries/subscribers/confirm-subscriber`) rather than a new row being
// inserted at confirmation time.
export const SUBSCRIBER_STATUS = ['pending', 'active'] as const;
export type TSubscriberStatus = (typeof SUBSCRIBER_STATUS)[number];

export const subscribers = pgTable('subscribers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  status: text('status', { enum: SUBSCRIBER_STATUS })
    .notNull()
    .default('pending'),
  // The token embedded in the confirmation-email link
  // (`/newsletter/confirm?token=...`, wired in #1104). Generated the same
  // way `users.id` is (auth.ts) — `crypto.randomUUID()` is unguessable
  // enough for a confirm-by-click link, and generating it here (rather than
  // in `web`, the way Auth.js's own `verificationTokens` token is generated
  // by the library that owns that table, not this schema) keeps token
  // issuance a `db`-layer concern the caller can't get wrong.
  confirmationToken: text('confirmation_token')
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  subscribedAt: timestamp('subscribed_at', { mode: 'date' })
    .notNull()
    .defaultNow(),
  // Set when `status` flips to `active`. Nullable/`undefined` (never a
  // sentinel date) while still `pending` — see
  // `queries/subscribers/confirm-subscriber`'s view-model mapping.
  confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
});

export type TSubscriber = typeof subscribers.$inferSelect;
