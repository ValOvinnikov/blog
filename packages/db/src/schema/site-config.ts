import type { TVoicePortableText } from '@blog/config';
import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  type TCardStyle,
  type TDensity,
  type TFontChoice,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
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

export const languageSwitcherStyleEnum = pgEnum(
  'language_switcher_style',
  Object.values(LANGUAGE_SWITCHER_STYLE) as [
    TLanguageSwitcherStyle,
    ...TLanguageSwitcherStyle[],
  ],
);

export const cardStyleEnum = pgEnum(
  'card_style',
  Object.values(CARD_STYLE) as [TCardStyle, ...TCardStyle[]],
);

export type TVoiceOverrideValue = string | TVoicePortableText;

export type TVoiceOverrides = Record<string, TVoiceOverrideValue>;

export type TVoiceOverridesByLocale = Partial<
  Record<TLocaleIsoCode, TVoiceOverrides>
>;

// `voiceOverridesByLocale` defaults to `{}` so "no overrides" has one representation, never also null.
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
  languageSwitcherStyle: languageSwitcherStyleEnum('language_switcher_style')
    .notNull()
    .default(LANGUAGE_SWITCHER_STYLE.MENU_CODE),
  cardStyle: cardStyleEnum('card_style')
    .notNull()
    .default(CARD_STYLE.ACCENT_BAR),
  logoAssetUrl: text('logo_asset_url'),
  faviconAssetUrl: text('favicon_asset_url'),
  voiceOverridesByLocale: jsonb('voice_overrides')
    .$type<TVoiceOverridesByLocale>()
    .notNull()
    .default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSiteConfig = typeof siteConfig.$inferSelect;
