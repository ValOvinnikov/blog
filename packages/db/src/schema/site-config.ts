import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config/constants';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

export const presetIdEnum = pgEnum(
  'preset_id',
  Object.values(PRESET_ID) as [TPresetId, ...TPresetId[]],
);

export const fontChoiceEnum = pgEnum(
  'font_choice',
  Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
);

export const radiusScaleEnum = pgEnum(
  'radius_scale',
  Object.values(RADIUS_SCALE) as [TRadiusScale, ...TRadiusScale[]],
);

export const densityEnum = pgEnum(
  'density',
  Object.values(DENSITY) as [TDensity, ...TDensity[]],
);

// One row per tenant — `tenantId` is unique so an upsert can target it
// directly. Theme gets typed columns (six knobs, unchanged since first
// shipped); voice gets one JSONB column, since its curated key list moves
// independently of this table's shape. `logoHue` unset means "follow
// accentHue"; `voiceOverrides` defaults to `{}` rather than null so "no
// overrides" and "the JSONB column itself is absent" are never two
// different states callers have to distinguish.
export const siteConfig = pgTable('site_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  preset: presetIdEnum('preset').notNull(),
  accentHue: integer('accent_hue').notNull(),
  logoHue: integer('logo_hue'),
  headingFont: fontChoiceEnum('heading_font').notNull(),
  bodyFont: fontChoiceEnum('body_font').notNull(),
  radiusScale: radiusScaleEnum('radius_scale').notNull(),
  density: densityEnum('density').notNull(),
  logoAssetUrl: text('logo_asset_url'),
  faviconAssetUrl: text('favicon_asset_url'),
  voiceOverrides: jsonb('voice_overrides')
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSiteConfig = typeof siteConfig.$inferSelect;
