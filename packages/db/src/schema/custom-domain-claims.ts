import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

const CUSTOM_DOMAIN_CLAIMS_TENANT_UNIQUE_NAME =
  'custom_domain_claims_tenant_id_unique';

export const customDomainClaims = pgTable('custom_domain_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' })
    .unique(CUSTOM_DOMAIN_CLAIMS_TENANT_UNIQUE_NAME),
  domain: text('domain').notNull(),
  token: text('token').notNull(),
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
});

export type TCustomDomainClaim = typeof customDomainClaims.$inferSelect;
