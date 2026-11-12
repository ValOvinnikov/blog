import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_POST_SEND_OUTCOME,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterLimitNoticeKind,
  type TNewsletterPostSendOutcome,
  type TNewsletterSkipReason,
} from '@blog/db/constants';
import {
  date,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

export const newsletterPostSends = pgTable(
  'newsletter_post_sends',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull(),
    claimedAt: timestamp('claimed_at', { mode: 'date' }).notNull(),
    outcome: text('outcome', {
      enum: Object.values(NEWSLETTER_POST_SEND_OUTCOME) as [
        TNewsletterPostSendOutcome,
        ...TNewsletterPostSendOutcome[],
      ],
    }),
    skipReason: text('skip_reason', {
      enum: Object.values(NEWSLETTER_SKIP_REASON) as [
        TNewsletterSkipReason,
        ...TNewsletterSkipReason[],
      ],
    }),
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.postId] })],
);

export type TNewsletterPostSend = typeof newsletterPostSends.$inferSelect;

export const newsletterLimitNotices = pgTable(
  'newsletter_limit_notices',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    month: date('month', { mode: 'string' }).notNull(),
    kind: text('kind', {
      enum: Object.values(NEWSLETTER_LIMIT_NOTICE_KIND) as [
        TNewsletterLimitNoticeKind,
        ...TNewsletterLimitNoticeKind[],
      ],
    }).notNull(),
    sentAt: timestamp('sent_at', { mode: 'date' }).notNull(),
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.month, row.kind] })],
);

export type TNewsletterLimitNotice = typeof newsletterLimitNotices.$inferSelect;
