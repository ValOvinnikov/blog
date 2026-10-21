import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const magicLinkSendCounters = pgTable('magic_link_send_counters', {
  key: text('key').primaryKey(),
  windowStartedAt: timestamp('window_started_at', { mode: 'date' }).notNull(),
  count: integer('count').notNull(),
});
