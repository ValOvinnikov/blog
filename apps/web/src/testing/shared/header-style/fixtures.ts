import {
  BRAND_VARIANT,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type IHeaderStyle,
} from '@shinefold/config';

export const MOCK_HEADER_STYLE: IHeaderStyle = {
  layout: HEADER_LAYOUT.CLASSIC,
  submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  background: BRAND_VARIANT.PRIMARY,
};
