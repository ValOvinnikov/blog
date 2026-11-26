import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
} from './account-control';
import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from './busy-button';
import { BUTTON_SHAPE } from './button-shape';
import { CAPABILITY } from './capability';
import { CARD_STYLE } from './card-style';
import { CONSOLE_BUNDLE } from './console-preset-bundle';
import { DIVIDER_WIDTH } from './divider-width';
import {
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
} from './footer-layout';
import {
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
} from './header-action';
import { HEADER_CONTROL_SHAPE } from './header-control-shape';
import { HEADER_CONTROL_STYLE } from './header-control-style';
import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from './header-layout';
import { HEADING_CASE, HEADING_WEIGHT } from './heading-style';
import { IMAGE_PROPORTION } from './image-proportion';
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
  [PRESET_ID.CONSOLE]: CONSOLE_BUNDLE,
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
    headerControlShape: HEADER_CONTROL_SHAPE.ROUND,
    headerActionStyle: HEADER_ACTION_STYLE.FILLED,
    headerActionPhonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
    accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
    accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
    busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
    spinnerStyle: SPINNER_STYLE.RING,
    buttonShape: BUTTON_SHAPE.ROUNDED,
    headerLayout: HEADER_LAYOUT.CLASSIC,
    headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
    headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
    headerBackground: BRAND_VARIANT.PRIMARY,
    breadcrumbBackground: BRAND_VARIANT.PRIMARY,
    navLinkStyle: NAV_LINK_STYLE.PLAIN,
    headingWeight: HEADING_WEIGHT.MEDIUM,
    headingCase: HEADING_CASE.AS_WRITTEN,
    imageProportion: IMAGE_PROPORTION.AS_DESIGNED,
    dividerWidth: DIVIDER_WIDTH.HAIRLINE,
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
  // TODO(#8038): the Shinefold preset's own bundle replaces this stand-in.
  [PRESET_ID.SHINEFOLD]: CONSOLE_BUNDLE,
};
