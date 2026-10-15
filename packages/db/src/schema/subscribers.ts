import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

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
    confirmationToken: text('confirmation_token')
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID()),
    unsubscribeToken: text('unsubscribe_token')
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID()),
    subscribedAt: timestamp('subscribed_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    confirmationSentAt: timestamp('confirmation_sent_at', { mode: 'date' }),
  },
  (subscriber) => [unique().on(subscriber.tenantId, subscriber.email)],
);

export type TSubscriber = typeof subscribers.$inferSelect;
