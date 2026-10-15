import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// Column defaults mirror `PRESET_REGISTRY`'s `CONSOLE` `featureDefaults`; a
// tenant with no row reads its preset's defaults instead.
export const settingsFeatures = pgTable('settings_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  commentsEnabled: boolean('comments_enabled').notNull().default(true),
  ratingsEnabled: boolean('ratings_enabled').notNull().default(true),
  bookmarksEnabled: boolean('bookmarks_enabled').notNull().default(true),
  newsletterEnabled: boolean('newsletter_enabled').notNull().default(false),
  analyticsEnabled: boolean('analytics_enabled').notNull().default(false),
  consentBannerEnabled: boolean('consent_banner_enabled')
    .notNull()
    .default(false),
  contactFormEnabled: boolean('contact_form_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSettingsFeatures = typeof settingsFeatures.$inferSelect;
