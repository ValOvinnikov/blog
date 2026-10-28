import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  CREATED_AT_COLUMN,
  EMAIL_ENCRYPTED_COLUMN,
  EMAIL_EXACT_INDEX_COLUMN,
  EMAIL_INDEX_COLUMN,
} from './columns';
import { membershipRoleEnum } from './memberships';
import { tenants } from './tenants';

export const membershipInvites = pgTable(
  'membership_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    emailEncrypted: text(EMAIL_ENCRYPTED_COLUMN).notNull(),
    emailIndex: text(EMAIL_INDEX_COLUMN).notNull(),
    emailExactIndex: text(EMAIL_EXACT_INDEX_COLUMN),
    role: membershipRoleEnum('role').notNull(),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    consumedAt: timestamp('consumed_at', { mode: 'date' }),
  },
  (invite) => [
    unique().on(invite.tenantId, invite.emailExactIndex),
    index('membership_invites_email_index_idx').on(invite.emailIndex),
  ],
);

export type TMembershipInvite = typeof membershipInvites.$inferSelect;
