import type { TVoicePortableText } from '@blog/config';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
  type TLocaleIsoCode,
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

import { CREATED_AT_COLUMN, UPDATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const presetIdEnum = pgEnum('preset_id', PRESET_ID);

export const fontChoiceEnum = pgEnum('font_choice', FONT_CHOICE);

export const radiusScaleEnum = pgEnum('radius_scale', RADIUS_SCALE);

export const densityEnum = pgEnum('density', DENSITY);

export const languageSwitcherStyleEnum = pgEnum(
  'language_switcher_style',
  LANGUAGE_SWITCHER_STYLE,
);

export const cardStyleEnum = pgEnum('card_style', CARD_STYLE);

export const headerControlStyleEnum = pgEnum(
  'header_control_style',
  HEADER_CONTROL_STYLE,
);

export const accountButtonStyleEnum = pgEnum(
  'account_button_style',
  ACCOUNT_BUTTON_STYLE,
);

export const accountPanelStyleEnum = pgEnum(
  'account_panel_style',
  ACCOUNT_PANEL_STYLE,
);

export const accountPhonePlacementEnum = pgEnum(
  'account_phone_placement',
  ACCOUNT_PHONE_PLACEMENT,
);

export const busyButtonStyleEnum = pgEnum(
  'busy_button_style',
  BUSY_BUTTON_STYLE,
);

export const spinnerStyleEnum = pgEnum('spinner_style', SPINNER_STYLE);

export const headerLayoutEnum = pgEnum('header_layout', HEADER_LAYOUT);

export const headerSubmenuStyleEnum = pgEnum(
  'header_submenu_style',
  HEADER_SUBMENU_STYLE,
);

export const headerBarStyleEnum = pgEnum('header_bar_style', HEADER_BAR_STYLE);

export const footerLayoutEnum = pgEnum('footer_layout', FOOTER_LAYOUT);

export const footerBackgroundEnum = pgEnum('footer_background', BRAND_VARIANT);

export const footerSurfaceEnum = pgEnum('footer_surface', FOOTER_SURFACE);

export const cookieSettingsButtonEnum = pgEnum(
  'cookie_settings_button',
  COOKIE_SETTINGS_BUTTON,
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
  headerControlStyle: headerControlStyleEnum('header_control_style')
    .notNull()
    .default(HEADER_CONTROL_STYLE.OUTLINED),
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
  headerLayout: headerLayoutEnum('header_layout')
    .notNull()
    .default(HEADER_LAYOUT.CLASSIC),
  headerSubmenuStyle: headerSubmenuStyleEnum('header_submenu_style')
    .notNull()
    .default(HEADER_SUBMENU_STYLE.DROPDOWN),
  headerBarStyle: headerBarStyleEnum('header_bar_style')
    .notNull()
    .default(HEADER_BAR_STYLE.FULL_WIDTH),
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
