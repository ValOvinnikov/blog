import {
  HEADER_BAR_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  NAV_LINK_STYLE,
} from '@blog/config/constants';

import {
  headerBarStyleEnum,
  headerControlShapeEnum,
  headerControlStyleEnum,
  headerLayoutEnum,
  headerSubmenuStyleEnum,
  navLinkStyleEnum,
} from './site-config-enums';

export const siteConfigHeaderColumns = {
  headerControlStyle: headerControlStyleEnum('header_control_style')
    .notNull()
    .default(HEADER_CONTROL_STYLE.OUTLINED),
  headerControlShape: headerControlShapeEnum('header_control_shape')
    .notNull()
    .default(HEADER_CONTROL_SHAPE.ROUND),
  headerLayout: headerLayoutEnum('header_layout')
    .notNull()
    .default(HEADER_LAYOUT.CLASSIC),
  headerSubmenuStyle: headerSubmenuStyleEnum('header_submenu_style')
    .notNull()
    .default(HEADER_SUBMENU_STYLE.DROPDOWN),
  headerBarStyle: headerBarStyleEnum('header_bar_style')
    .notNull()
    .default(HEADER_BAR_STYLE.FULL_WIDTH),
  navLinkStyle: navLinkStyleEnum('nav_link_style')
    .notNull()
    .default(NAV_LINK_STYLE.PLAIN),
};
