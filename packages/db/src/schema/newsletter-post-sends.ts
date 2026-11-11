import {
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
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.postId] })],
);

export type TNewsletterPostSend = typeof newsletterPostSends.$inferSelect;
