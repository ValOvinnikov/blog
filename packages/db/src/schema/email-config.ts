import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const emailConfig = pgTable('email_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  logoAssetUrl: text('logo_asset_url'),
  senderName: text('sender_name'),
  replyToAddress: text('reply_to_address'),
  footerPostalAddress: text('footer_postal_address'),
  contactRecipient: text('contact_recipient'),
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TEmailConfig = typeof emailConfig.$inferSelect;
