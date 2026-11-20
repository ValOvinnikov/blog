import { integer, text, timestamp } from 'drizzle-orm/pg-core';

export const fixedWindowCounterColumns = {
  key: text('key').primaryKey(),
  windowStartedAt: timestamp('window_started_at').notNull(),
  count: integer('count').notNull(),
};
