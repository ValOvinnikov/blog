import {
  SUBSCRIBER_STATUS,
  type TSubscriberStatus,
} from '@shinefold/db/constants';
import { sha256Hex } from '@shinefold/utils/hash';
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  EMAIL_ENCRYPTED_COLUMN,
  EMAIL_EXACT_INDEX_COLUMN,
  EMAIL_INDEX_COLUMN,
} from './columns';
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
    emailEncrypted: text(EMAIL_ENCRYPTED_COLUMN).notNull(),
    emailIndex: text(EMAIL_INDEX_COLUMN).notNull(),
    emailExactIndex: text(EMAIL_EXACT_INDEX_COLUMN),
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
    subscribedAt: timestamp('subscribed_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    confirmationSentAt: timestamp('confirmation_sent_at', { mode: 'date' }),
  },
  (subscriber) => [
    unique().on(subscriber.tenantId, subscriber.emailExactIndex),
    index('subscribers_tenant_email_index_idx').on(
      subscriber.tenantId,
      subscriber.emailIndex,
    ),
    index('subscribers_tenant_status_id_idx').on(
      subscriber.tenantId,
      subscriber.status,
      subscriber.id,
    ),
    index('subscribers_tenant_status_confirmed_at_id_idx').on(
      subscriber.tenantId,
      subscriber.status,
      subscriber.confirmedAt,
      subscriber.id,
    ),
  ],
);

export type TSubscriber = typeof subscribers.$inferSelect;
