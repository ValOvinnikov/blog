import type { TSanityLoginProvider } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './auth';
import { CREATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const membershipRoleEnum = pgEnum('membership_role', MEMBERSHIP_ROLE);

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
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    lockedAt: timestamp('locked_at', { mode: 'date' }),
    sanityInviteId: text('sanity_invite_id'),
    sanityInviteSentAt: timestamp('sanity_invite_sent_at', { mode: 'date' }),
    sanityInviteAcceptedAt: timestamp('sanity_invite_accepted_at', {
      mode: 'date',
    }),
    sanityUserId: text('sanity_user_id'),
    sanityLoginProvider: text(
      'sanity_login_provider',
    ).$type<TSanityLoginProvider>(),
  },
  (membership) => [unique().on(membership.userId, membership.tenantId)],
);

export type TMembership = typeof memberships.$inferSelect;
