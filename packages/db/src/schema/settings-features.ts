import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// One row per tenant — `tenantId` is unique so an upsert can target it
// directly, mirroring `site_config`. Column defaults match `PRESET_REGISTRY`'s
// `CONSOLE` `featureDefaults` (`@blog/config`) as a Postgres-level safety
// net; the real source of truth for a newly-provisioned tenant's initial
// values is the provisioning script, not these defaults.
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
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSettingsFeatures = typeof settingsFeatures.$inferSelect;
