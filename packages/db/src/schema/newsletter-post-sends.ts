import {
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_POST_SEND_OUTCOME,
  type TNewsletterLimitNoticeKind,
  type TNewsletterPostSendOutcome,
} from '@shinefold/db/constants';
import {
  date,
  integer,
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
    postTitle: text('post_title'),
    postPublishedAt: timestamp('post_published_at', { mode: 'date' }),
    recipientCount: integer('recipient_count'),
    sentCount: integer('sent_count').notNull().default(0),
    emailsNeeded: integer('emails_needed'),
    allowanceLeft: integer('allowance_left'),
    bandCeiling: integer('band_ceiling'),
    scheduledFor: timestamp('scheduled_for', { mode: 'date' }),
    settledAt: timestamp('settled_at', { mode: 'date' }),
    handStartedAt: timestamp('hand_started_at', { mode: 'date' }),
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
