import {
  BRAND_VARIANT,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  type IFooterStyle,
} from '@blog/config';

export const MOCK_FOOTER_STYLE: IFooterStyle = {
  layout: FOOTER_LAYOUT.COLUMNS,
  background: BRAND_VARIANT.BRAND_PRIMARY,
  surface: FOOTER_SURFACE.FULL_WIDTH,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.HIDDEN,
};
