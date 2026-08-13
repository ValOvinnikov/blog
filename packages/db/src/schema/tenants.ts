import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/config/constants';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenantPlanEnum = pgEnum(
  'tenant_plan',
  Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]],
);

export const tenantStatusEnum = pgEnum(
  'tenant_status',
  Object.values(TENANT_STATUS) as [TTenantStatus, ...TTenantStatus[]],
);

// `primaryDomain` is the canonical domain; `tenant_domains` holds every
// domain (including this one) a tenant answers to.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  primaryDomain: text('primary_domain').notNull(),
  sanityProjectId: text('sanity_project_id').notNull(),
  sanityDataset: text('sanity_dataset').notNull(),
  locale: text('locale').notNull(),
  plan: tenantPlanEnum('plan').notNull(),
  status: tenantStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TTenant = typeof tenants.$inferSelect;
