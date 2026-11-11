import { boolean, pgTable, uuid } from 'drizzle-orm/pg-core';

import { timestampColumns } from './columns';
import { tenants } from './tenants';

// Column defaults mirror `PRESET_REGISTRY`'s `CONSOLE` `featureDefaults`; a
// tenant with no row reads its preset's defaults instead.
export const settingsFeatures = pgTable('settings_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  readerAccountsEnabled: boolean('reader_accounts_enabled')
    .notNull()
    .default(false),
  commentsEnabled: boolean('comments_enabled').notNull().default(false),
  ratingsEnabled: boolean('ratings_enabled').notNull().default(false),
  bookmarksEnabled: boolean('bookmarks_enabled').notNull().default(true),
  newsletterEnabled: boolean('newsletter_enabled').notNull().default(false),
  analyticsEnabled: boolean('analytics_enabled').notNull().default(false),
  consentBannerEnabled: boolean('consent_banner_enabled')
    .notNull()
    .default(false),
  contactFormEnabled: boolean('contact_form_enabled').notNull().default(true),
  ...timestampColumns,
});

export type TSettingsFeatures = typeof settingsFeatures.$inferSelect;
