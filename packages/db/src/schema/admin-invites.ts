import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminRoleEnum } from './admins';
import { users } from './auth';
import {
  CREATED_AT_COLUMN,
  EMAIL_ENCRYPTED_COLUMN,
  EMAIL_EXACT_INDEX_COLUMN,
  EMAIL_INDEX_COLUMN,
} from './columns';

export const adminInvites = pgTable(
  'admin_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailEncrypted: text(EMAIL_ENCRYPTED_COLUMN).notNull(),
    emailIndex: text(EMAIL_INDEX_COLUMN).notNull(),
    emailExactIndex: text(EMAIL_EXACT_INDEX_COLUMN).notNull().unique(),
    role: adminRoleEnum('role').notNull(),
    invitedBy: text('invited_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  },
  (invite) => [index('admin_invites_email_index_idx').on(invite.emailIndex)],
);

export type TAdminInvite = typeof adminInvites.$inferSelect;
