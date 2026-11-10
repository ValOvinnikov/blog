import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
} from './account-control';
import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from './busy-button';
import { BUTTON_SHAPE } from './button-shape';
import { CAPABILITY } from './capability';
import { CARD_STYLE } from './card-style';
import {
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
} from './footer-layout';
import { HEADER_CONTROL_STYLE } from './header-control-style';
import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from './header-layout';
import { BRAND_VARIANT } from './layout';
import { NAV_LINK_STYLE } from './nav-link-style';
import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TPresetBundle,
  type TPresetId,
} from './preset';

export const PRESET_REGISTRY: Record<TPresetId, TPresetBundle> = {
  [PRESET_ID.CONSOLE]: {
    themeTokens: {
      accentHue: 250,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
    },
    cardStyle: CARD_STYLE.ACCENT_BAR,
    headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
    accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
    busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
    spinnerStyle: SPINNER_STYLE.BRAILLE,
    buttonShape: BUTTON_SHAPE.ROUNDED,
    headerLayout: HEADER_LAYOUT.CLASSIC,
    headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
    headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
    navLinkStyle: NAV_LINK_STYLE.PLAIN,
    footerLayout: FOOTER_LAYOUT.COLUMNS,
    footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
    footerSurface: FOOTER_SURFACE.FULL_WIDTH,
    cookieSettingsButton: COOKIE_SETTINGS_BUTTON.HIDDEN,
    featureDefaults: {
      [CAPABILITY.READER_ACCOUNTS]: false,
      [CAPABILITY.COMMENTS]: false,
      [CAPABILITY.RATINGS]: false,
      [CAPABILITY.BOOKMARKS]: true,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: false,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: true,
    },
  },
  [PRESET_ID.EDITORIAL]: {
    themeTokens: {
      accentHue: 28,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
    },
    cardStyle: CARD_STYLE.OUTLINED,
    headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
    accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
    busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
    spinnerStyle: SPINNER_STYLE.RING,
    buttonShape: BUTTON_SHAPE.ROUNDED,
    headerLayout: HEADER_LAYOUT.CLASSIC,
    headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
    headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
    navLinkStyle: NAV_LINK_STYLE.PLAIN,
    footerLayout: FOOTER_LAYOUT.COLUMNS,
    footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
    footerSurface: FOOTER_SURFACE.FULL_WIDTH,
    cookieSettingsButton: COOKIE_SETTINGS_BUTTON.HIDDEN,
    featureDefaults: {
      [CAPABILITY.READER_ACCOUNTS]: false,
      [CAPABILITY.COMMENTS]: false,
      [CAPABILITY.RATINGS]: false,
      [CAPABILITY.BOOKMARKS]: true,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: false,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: true,
    },
  },
};
