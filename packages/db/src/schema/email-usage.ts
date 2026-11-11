import { EMAIL_TYPE, type TEmailType } from '@blog/config/constants';
import {
  EMAIL_DELIVERY_OUTCOME,
  type TEmailDeliveryOutcome,
} from '@blog/db/constants';
import {
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

const DAY_COLUMN = 'day';
const COUNT_COLUMN = 'count';

export const emailSendCounts = pgTable(
  'email_send_counts',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    day: date(DAY_COLUMN, { mode: 'string' }).notNull(),
    emailType: text('email_type', {
      enum: Object.values(EMAIL_TYPE) as [TEmailType, ...TEmailType[]],
    }).notNull(),
    count: integer(COUNT_COLUMN).notNull().default(0),
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.day, row.emailType] })],
);

export type TEmailSendCount = typeof emailSendCounts.$inferSelect;

export const emailDeliveryOutcomeCounts = pgTable(
  'email_delivery_outcome_counts',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    day: date(DAY_COLUMN, { mode: 'string' }).notNull(),
    outcome: text('outcome', {
      enum: Object.values(EMAIL_DELIVERY_OUTCOME) as [
        TEmailDeliveryOutcome,
        ...TEmailDeliveryOutcome[],
      ],
    }).notNull(),
    count: integer(COUNT_COLUMN).notNull().default(0),
  },
  (row) => [primaryKey({ columns: [row.tenantId, row.day, row.outcome] })],
);

export type TEmailDeliveryOutcomeCount =
  typeof emailDeliveryOutcomeCounts.$inferSelect;
