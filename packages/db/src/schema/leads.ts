import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    message: text('message').notNull(),
    sourcePath: text('source_path').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (lead) => [
    index('leads_tenant_created_at_idx').on(
      lead.tenantId,
      lead.createdAt.desc(),
    ),
  ],
);

export type TLead = typeof leads.$inferSelect;
