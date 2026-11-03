import {
  SUSPENSION_REFERENCE_DIGITS,
  SUSPENSION_REFERENCE_PREFIX,
  type TSuspensionCategory,
} from '@blog/db/constants';
import { isNull, sql } from 'drizzle-orm';
import {
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { tenants } from './tenants';

const REFERENCE_SEQUENCE_NAME = 'tenant_suspension_reference_seq';

export const tenantSuspensionReferenceSequence = pgSequence(
  REFERENCE_SEQUENCE_NAME,
);

export const tenantSuspensions = pgTable(
  'tenant_suspensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reference: text('reference')
      .notNull()
      .unique()
      .default(
        sql.raw(
          `'${SUSPENSION_REFERENCE_PREFIX}' || lpad(nextval('${REFERENCE_SEQUENCE_NAME}')::text, ${SUSPENSION_REFERENCE_DIGITS}, '0')`,
        ),
      ),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    category: text('category').notNull().$type<TSuspensionCategory>(),
    description: text('description').notNull(),
    suspendedBy: uuid('suspended_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    suspendedAt: timestamp('suspended_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    liftedAt: timestamp('lifted_at', { mode: 'date' }),
    liftedBy: uuid('lifted_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
  },
  (suspension) => [
    uniqueIndex('tenant_suspensions_open_tenant_idx')
      .on(suspension.tenantId)
      .where(isNull(suspension.liftedAt)),
  ],
);

export type TTenantSuspension = typeof tenantSuspensions.$inferSelect;
