import { MEMBERSHIP_ROLE, type TMembershipRole } from '@blog/config/constants';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './auth';
import { tenants } from './tenants';

export const membershipRoleEnum = pgEnum(
  'membership_role',
  Object.values(MEMBERSHIP_ROLE) as [TMembershipRole, ...TMembershipRole[]],
);

// Joins `users` x `tenants` — a user's role on a given tenant. A user may
// hold at most one membership per tenant (unique on the pair), but many
// memberships across tenants.
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (membership) => [unique().on(membership.userId, membership.tenantId)],
);

export type TMembership = typeof memberships.$inferSelect;
