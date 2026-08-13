import { ADMIN_ROLE, type TAdminRole } from '@blog/config/constants';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const adminRoleEnum = pgEnum(
  'admin_role',
  Object.values(ADMIN_ROLE) as [TAdminRole, ...TAdminRole[]],
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
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TAdmin = typeof admins.$inferSelect;
