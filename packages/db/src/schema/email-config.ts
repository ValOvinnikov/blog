import { EMAIL_NEW_POSTS_DEFAULT } from '@blog/db/constants';
import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestampColumns } from './columns';
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
  emailNewPosts: boolean('email_new_posts')
    .notNull()
    .default(EMAIL_NEW_POSTS_DEFAULT),
  ...timestampColumns,
});

export type TEmailConfig = typeof emailConfig.$inferSelect;
