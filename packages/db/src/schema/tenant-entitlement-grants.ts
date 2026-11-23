import type {
  TEntitlementGrantKey,
  TEntitlementKind,
} from '@shinefold/db/constants';
import { isNull } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { EXPIRES_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const TENANT_ENTITLEMENT_GRANTS_OPEN_UNIQUE_NAME =
  'tenant_entitlement_grants_open_idx';

export const tenantEntitlementGrants = pgTable(
  'tenant_entitlement_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().$type<TEntitlementKind>(),
    key: text('key').notNull().$type<TEntitlementGrantKey>(),
    value: integer('value'),
    note: text('note'),
    grantedBy: uuid('granted_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    grantedAt: timestamp('granted_at', { mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp(EXPIRES_AT_COLUMN, { mode: 'date' }),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    revokedBy: uuid('revoked_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
  },
  (grant) => [
    uniqueIndex(TENANT_ENTITLEMENT_GRANTS_OPEN_UNIQUE_NAME)
      .on(grant.tenantId, grant.kind, grant.key)
      .where(isNull(grant.revokedAt)),
  ],
);

export type TTenantEntitlementGrant =
  typeof tenantEntitlementGrants.$inferSelect;
