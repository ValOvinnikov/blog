import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { tenants } from './tenants';

export const pinnedTenants = pgTable(
  'pinned_tenants',
  {
    adminId: uuid('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    pinnedAt: timestamp('pinned_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (pin) => [
    primaryKey({ columns: [pin.adminId, pin.tenantId] }),
    index('pinned_tenants_tenant_id_idx').on(pin.tenantId),
  ],
);

export type TPinnedTenant = typeof pinnedTenants.$inferSelect;
