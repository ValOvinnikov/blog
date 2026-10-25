import { SUBSCRIBER_STATUS, type TSubscriberStatus } from '@blog/db/constants';
import { sha256Hex } from '@blog/utils/hash';
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { EMAIL_ENCRYPTED_COLUMN, EMAIL_INDEX_COLUMN } from './columns';
import { tenants } from './tenants';

function mintUnusableTokenHash(): string {
  return sha256Hex(crypto.randomUUID());
}

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
    emailEncrypted: text(EMAIL_ENCRYPTED_COLUMN),
    emailIndex: text(EMAIL_INDEX_COLUMN),
    status: text('status', {
      enum: Object.values(SUBSCRIBER_STATUS) as [
        TSubscriberStatus,
        ...TSubscriberStatus[],
      ],
    })
      .notNull()
      .default(SUBSCRIBER_STATUS.PENDING),
    // Globally unique rather than per tenant: the confirm link carries only the token.
    // The default hashes a token nobody holds; real ones are minted per email sent.
    confirmationTokenHash: text('confirmation_token_hash')
      .notNull()
      .unique()
      .$defaultFn(mintUnusableTokenHash),
    // Nothing writes it: it only matches unsubscribe links emailed before they were signed.
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
  (subscriber) => [
    unique().on(subscriber.tenantId, subscriber.email),
    index('subscribers_tenant_email_index_idx').on(
      subscriber.tenantId,
      subscriber.emailIndex,
    ),
  ],
);

export type TSubscriber = typeof subscribers.$inferSelect;
