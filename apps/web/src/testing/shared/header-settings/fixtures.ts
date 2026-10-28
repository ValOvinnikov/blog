import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from '@blog/config';
import type { IHeaderSettings } from '@web/server/site-config/get-header-settings/get-header-settings';

export const MOCK_HEADER_SETTINGS: IHeaderSettings = {
  layout: HEADER_LAYOUT.CLASSIC,
  submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
};
