import { date, integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

export const takeawayGenerationCounts = pgTable(
  'takeaway_generation_counts',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    month: date('month', { mode: 'string' }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.month] })],
);

export type TTakeawayGenerationCount =
  typeof takeawayGenerationCounts.$inferSelect;
