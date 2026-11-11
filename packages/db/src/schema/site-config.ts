import type { TVoicePortableText } from '@blog/config';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  LANGUAGE_SWITCHER_STYLE,
  SPINNER_STYLE,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN, UPDATED_AT_COLUMN } from './columns';
import {
  accountButtonStyleEnum,
  accountPanelStyleEnum,
  accountPhonePlacementEnum,
  busyButtonStyleEnum,
  buttonShapeEnum,
  cardStyleEnum,
  cookieSettingsButtonEnum,
  densityEnum,
  fontChoiceEnum,
  footerBackgroundEnum,
  footerLayoutEnum,
  footerSurfaceEnum,
  languageSwitcherStyleEnum,
  presetIdEnum,
  radiusScaleEnum,
  spinnerStyleEnum,
} from './site-config-enums';
import { siteConfigHeaderColumns } from './site-config-header-columns';
import { tenants } from './tenants';

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
  ...siteConfigHeaderColumns,
  accountButtonStyle: accountButtonStyleEnum('account_button_style')
    .notNull()
    .default(ACCOUNT_BUTTON_STYLE.PILL),
  accountPanelStyle: accountPanelStyleEnum('account_panel_style')
    .notNull()
    .default(ACCOUNT_PANEL_STYLE.CARD),
  accountPhonePlacement: accountPhonePlacementEnum('account_phone_placement')
    .notNull()
    .default(ACCOUNT_PHONE_PLACEMENT.BAR),
  busyButtonStyle: busyButtonStyleEnum('busy_button_style')
    .notNull()
    .default(BUSY_BUTTON_STYLE.LABEL),
  spinnerStyle: spinnerStyleEnum('spinner_style')
    .notNull()
    .default(SPINNER_STYLE.BRAILLE),
  buttonShape: buttonShapeEnum('button_shape')
    .notNull()
    .default(BUTTON_SHAPE.ROUNDED),
  footerLayout: footerLayoutEnum('footer_layout')
    .notNull()
    .default(FOOTER_LAYOUT.COLUMNS),
  footerBackground: footerBackgroundEnum('footer_background')
    .notNull()
    .default(BRAND_VARIANT.BRAND_PRIMARY),
  footerSurface: footerSurfaceEnum('footer_surface')
    .notNull()
    .default(FOOTER_SURFACE.FULL_WIDTH),
  cookieSettingsButton: cookieSettingsButtonEnum('cookie_settings_button')
    .notNull()
    .default(COOKIE_SETTINGS_BUTTON.HIDDEN),
  brandName: text('brand_name'),
  logoAssetUrl: text('logo_asset_url'),
  faviconAssetUrl: text('favicon_asset_url'),
  voiceOverridesByLocale: jsonb('voice_overrides')
    .$type<TVoiceOverridesByLocale>()
    .notNull()
    .default({}),
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp(UPDATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSiteConfig = typeof siteConfig.$inferSelect;
