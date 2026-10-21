import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';
import { membershipRoleEnum } from './memberships';
import { tenants } from './tenants';

export const membershipInvites = pgTable(
  'membership_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    emailEncrypted: text('email_encrypted'),
    emailIndex: text('email_index'),
    role: membershipRoleEnum('role').notNull(),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    consumedAt: timestamp('consumed_at', { mode: 'date' }),
  },
  (invite) => [
    unique().on(invite.tenantId, invite.email),
    index('membership_invites_email_index_idx').on(invite.emailIndex),
  ],
);

export type TMembershipInvite = typeof membershipInvites.$inferSelect;
