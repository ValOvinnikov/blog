import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
} from '@shinefold/config';

export const MOCK_SAMPLE_HEADER_STYLE: TSampleHeaderStyle = {
  layout: HEADER_LAYOUT.CLASSIC,
  submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  background: BRAND_VARIANT.PRIMARY,
  breadcrumbBackground: BRAND_VARIANT.PRIMARY,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  account: {
    buttonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    panelStyle: ACCOUNT_PANEL_STYLE.CARD,
    phonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
  },
  action: {
    style: HEADER_ACTION_STYLE.FILLED,
    phonePlacement: HEADER_ACTION_PHONE_PLACEMENT.MENU,
  },
  hasThemeToggle: true,
};
