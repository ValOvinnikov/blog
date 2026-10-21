import {
  BLOCKED_IDENTITY_KIND,
  type TBlockedIdentityKind,
} from '@blog/db/constants';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { CREATED_AT_COLUMN } from './columns';

export const blockedIdentityKindEnum = pgEnum(
  'blocked_identity_kind',
  Object.values(BLOCKED_IDENTITY_KIND) as [
    TBlockedIdentityKind,
    ...TBlockedIdentityKind[],
  ],
);

// An ADDRESS `value` is the SHA-256 hex of the normalised address, never the
// address itself; a DOMAIN `value` is the lower-cased domain.
export const blockedSignupIdentities = pgTable(
  'blocked_signup_identities',
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: blockedIdentityKindEnum().notNull(),
    value: text().notNull(),
    reason: text('reason').notNull(),
    createdByAdminId: uuid('created_by_admin_id').references(() => admins.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp(CREATED_AT_COLUMN, { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (identity) => [
    unique('blocked_signup_identities_kind_value_unique').on(
      identity.kind,
      identity.value,
    ),
  ],
);

export type TBlockedSignupIdentity =
  typeof blockedSignupIdentities.$inferSelect;
