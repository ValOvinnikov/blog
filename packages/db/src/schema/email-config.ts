import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// One row per tenant — `tenantId` is unique so an upsert can target it
// directly, mirroring `site_config`/`settings_features`. Kept as its own
// table rather than columns on `site_config`: these four fields (identity on
// the From address, support routing, a legal footer requirement) have no
// visual-theme or voice relationship to that table's existing columns, and
// every field here is optional — a tenant with no row yet still sends mail,
// falling back to product defaults resolved by `@blog/email`.
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
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TEmailConfig = typeof emailConfig.$inferSelect;
