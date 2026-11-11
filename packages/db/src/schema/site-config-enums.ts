import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
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
  NAV_LINK_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config/constants';
import { pgEnum } from 'drizzle-orm/pg-core';

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

export const buttonShapeEnum = pgEnum('button_shape', BUTTON_SHAPE);

export const navLinkStyleEnum = pgEnum('nav_link_style', NAV_LINK_STYLE);

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
