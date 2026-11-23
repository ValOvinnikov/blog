import { ADMIN_ROLE, GRANTED_VIA } from '@shinefold/db/constants';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';
import { CREATED_AT_COLUMN } from './columns';

export const adminRoleEnum = pgEnum('admin_role', ADMIN_ROLE);

export const grantedViaEnum = pgEnum('granted_via', GRANTED_VIA);

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: adminRoleEnum('role').notNull(),
  grantedBy: text('granted_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  grantedVia: grantedViaEnum('granted_via').notNull(),
  grantedAt: timestamp('granted_at', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
});

export type TAdmin = typeof admins.$inferSelect;
