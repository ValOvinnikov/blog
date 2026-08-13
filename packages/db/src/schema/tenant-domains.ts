import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// Every domain a tenant answers to (a tenant has many). `tenants.primaryDomain`
// stays a plain column rather than a FK into this table, so the two tables
// don't reference each other circularly.
export const tenantDomains = pgTable('tenant_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TTenantDomain = typeof tenantDomains.$inferSelect;
