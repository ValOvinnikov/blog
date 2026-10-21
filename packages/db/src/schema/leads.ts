import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameEncrypted: text('name_encrypted'),
    email: text('email').notNull(),
    emailEncrypted: text('email_encrypted'),
    emailIndex: text('email_index'),
    message: text('message').notNull(),
    messageEncrypted: text('message_encrypted'),
    sourcePath: text('source_path').notNull(),
    createdAt: timestamp(CREATED_AT_COLUMN, {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (lead) => [
    index('leads_tenant_created_at_idx').on(
      lead.tenantId,
      lead.createdAt.desc(),
    ),
  ],
);

export type TLead = typeof leads.$inferSelect;
