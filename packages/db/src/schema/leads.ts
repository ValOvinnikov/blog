import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import {
  CREATED_AT_COLUMN,
  EMAIL_ENCRYPTED_COLUMN,
  EMAIL_INDEX_COLUMN,
  TIMESTAMP_WITH_TIME_ZONE,
} from './columns';
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
    emailEncrypted: text(EMAIL_ENCRYPTED_COLUMN),
    emailIndex: text(EMAIL_INDEX_COLUMN),
    message: text('message').notNull(),
    messageEncrypted: text('message_encrypted'),
    sourcePath: text('source_path').notNull(),
    sourceDocumentId: text('source_document_id'),
    sourceLocale: text('source_locale'),
    readAt: timestamp('read_at', TIMESTAMP_WITH_TIME_ZONE),
    createdAt: timestamp(CREATED_AT_COLUMN, TIMESTAMP_WITH_TIME_ZONE)
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
