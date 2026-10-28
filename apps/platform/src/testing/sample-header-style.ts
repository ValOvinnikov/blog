import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
} from '@blog/config';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';

export const MOCK_SAMPLE_HEADER_STYLE: TSampleHeaderStyle = {
  layout: HEADER_LAYOUT.CLASSIC,
  submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  account: {
    buttonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    panelStyle: ACCOUNT_PANEL_STYLE.CARD,
    phonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
  },
};
