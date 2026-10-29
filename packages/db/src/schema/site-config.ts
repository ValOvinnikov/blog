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
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
  type TBrandVariant,
  type TBusyButtonStyle,
  type TCardStyle,
  type TCookieSettingsButton,
  type TDensity,
  type TFontChoice,
  type TFooterLayout,
  type TFooterSurface,
  type THeaderBarStyle,
  type THeaderControlStyle,
  type THeaderLayout,
  type THeaderSubmenuStyle,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
  type TPresetId,
  type TRadiusScale,
  type TSpinnerStyle,
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

import { CREATED_AT_COLUMN } from './columns';
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

export const headerControlStyleEnum = pgEnum(
  'header_control_style',
  Object.values(HEADER_CONTROL_STYLE) as [
    THeaderControlStyle,
    ...THeaderControlStyle[],
  ],
);

export const accountButtonStyleEnum = pgEnum(
  'account_button_style',
  Object.values(ACCOUNT_BUTTON_STYLE) as [
    TAccountButtonStyle,
    ...TAccountButtonStyle[],
  ],
);

export const accountPanelStyleEnum = pgEnum(
  'account_panel_style',
  Object.values(ACCOUNT_PANEL_STYLE) as [
    TAccountPanelStyle,
    ...TAccountPanelStyle[],
  ],
);

export const accountPhonePlacementEnum = pgEnum(
  'account_phone_placement',
  Object.values(ACCOUNT_PHONE_PLACEMENT) as [
    TAccountPhonePlacement,
    ...TAccountPhonePlacement[],
  ],
);

export const busyButtonStyleEnum = pgEnum(
  'busy_button_style',
  Object.values(BUSY_BUTTON_STYLE) as [TBusyButtonStyle, ...TBusyButtonStyle[]],
);

export const spinnerStyleEnum = pgEnum(
  'spinner_style',
  Object.values(SPINNER_STYLE) as [TSpinnerStyle, ...TSpinnerStyle[]],
);

export const headerLayoutEnum = pgEnum(
  'header_layout',
  Object.values(HEADER_LAYOUT) as [THeaderLayout, ...THeaderLayout[]],
);

export const headerSubmenuStyleEnum = pgEnum(
  'header_submenu_style',
  Object.values(HEADER_SUBMENU_STYLE) as [
    THeaderSubmenuStyle,
    ...THeaderSubmenuStyle[],
  ],
);

export const headerBarStyleEnum = pgEnum(
  'header_bar_style',
  Object.values(HEADER_BAR_STYLE) as [THeaderBarStyle, ...THeaderBarStyle[]],
);

export const footerLayoutEnum = pgEnum(
  'footer_layout',
  Object.values(FOOTER_LAYOUT) as [TFooterLayout, ...TFooterLayout[]],
);

export const footerBackgroundEnum = pgEnum(
  'footer_background',
  Object.values(BRAND_VARIANT) as [TBrandVariant, ...TBrandVariant[]],
);

export const footerSurfaceEnum = pgEnum(
  'footer_surface',
  Object.values(FOOTER_SURFACE) as [TFooterSurface, ...TFooterSurface[]],
);

export const cookieSettingsButtonEnum = pgEnum(
  'cookie_settings_button',
  Object.values(COOKIE_SETTINGS_BUTTON) as [
    TCookieSettingsButton,
    ...TCookieSettingsButton[],
  ],
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
    .default(SPINNER_STYLE.PRESET),
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
  logoAssetUrl: text('logo_asset_url'),
  faviconAssetUrl: text('favicon_asset_url'),
  voiceOverridesByLocale: jsonb('voice_overrides')
    .$type<TVoiceOverridesByLocale>()
    .notNull()
    .default({}),
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TSiteConfig = typeof siteConfig.$inferSelect;
