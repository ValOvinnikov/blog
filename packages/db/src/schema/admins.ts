import {
  ADMIN_ROLE,
  GRANTED_VIA,
  type TAdminRole,
  type TGrantedVia,
} from '@blog/db/constants';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const adminRoleEnum = pgEnum(
  'admin_role',
  Object.values(ADMIN_ROLE) as [TAdminRole, ...TAdminRole[]],
);

export const grantedViaEnum = pgEnum(
  'granted_via',
  Object.values(GRANTED_VIA) as [TGrantedVia, ...TGrantedVia[]],
);

// Platform-level operator access — deliberately has no `tenantId`, unlike
// `memberships`. `role` is stored even though every value currently gates
// access identically.
export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: adminRoleEnum('role').notNull(),
  // A best-effort pointer to the granting user — goes NULL if that account is
  // later deleted, so it is not the source of truth for how the grant was
  // made (see `grantedVia`).
  grantedBy: text('granted_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  grantedVia: grantedViaEnum('granted_via').notNull(),
  grantedAt: timestamp('granted_at', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TAdmin = typeof admins.$inferSelect;
