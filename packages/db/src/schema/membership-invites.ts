import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { membershipRoleEnum } from './memberships';
import { tenants } from './tenants';

// A pending grant of tenant access to an email with no resolved user yet —
// kept as its own table rather than making `memberships.userId` nullable,
// since every existing authorization read already assumes a real user on
// every `memberships` row. Consumed once the invited email signs in for the
// first time: a real `memberships` row is inserted and `consumedAt` is
// stamped (see `consumeMembershipInvite`).
export const membershipInvites = pgTable(
  'membership_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: membershipRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    consumedAt: timestamp('consumed_at', { mode: 'date' }),
  },
  (invite) => [unique().on(invite.tenantId, invite.email)],
);

export type TMembershipInvite = typeof membershipInvites.$inferSelect;
