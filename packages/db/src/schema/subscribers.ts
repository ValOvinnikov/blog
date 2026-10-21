import { hashToken } from '@blog/utils/hash-token';
import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

function mintUnusableTokenHash(): string {
  return hashToken(crypto.randomUUID());
}

export const SUBSCRIBER_STATUS = ['pending', 'active'] as const;
export type TSubscriberStatus = (typeof SUBSCRIBER_STATUS)[number];

export const subscribers = pgTable(
  'subscribers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    status: text('status', { enum: SUBSCRIBER_STATUS })
      .notNull()
      .default('pending'),
    // Globally unique rather than per tenant: the confirm link carries only the token.
    // The default hashes a token nobody holds; real ones are minted per email sent.
    confirmationTokenHash: text('confirmation_token_hash')
      .notNull()
      .unique()
      .$defaultFn(mintUnusableTokenHash),
    unsubscribeTokenHash: text('unsubscribe_token_hash')
      .notNull()
      .unique()
      .$defaultFn(mintUnusableTokenHash),
    subscribedAt: timestamp('subscribed_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    confirmationSentAt: timestamp('confirmation_sent_at', { mode: 'date' }),
  },
  (subscriber) => [unique().on(subscriber.tenantId, subscriber.email)],
);

export type TSubscriber = typeof subscribers.$inferSelect;
