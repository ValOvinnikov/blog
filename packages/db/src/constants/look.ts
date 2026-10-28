import type { TValueOf } from '@blog/config/utils';
import type { TSiteConfig } from '@blog/db/schema/site-config';

// Values are site_config column names, so they keep the schema's camelCase.
export const LOOK_FIELD = {
  PRESET: 'preset',
  ACCENT_HUE: 'accentHue',
  LOGO_HUE: 'logoHue',
  HEADING_FONT: 'headingFont',
  BODY_FONT: 'bodyFont',
  RADIUS_SCALE: 'radiusScale',
  DENSITY: 'density',
  LANGUAGE_SWITCHER_STYLE: 'languageSwitcherStyle',
  CARD_STYLE: 'cardStyle',
  HEADER_CONTROL_STYLE: 'headerControlStyle',
  ACCOUNT_BUTTON_STYLE: 'accountButtonStyle',
  ACCOUNT_PANEL_STYLE: 'accountPanelStyle',
  ACCOUNT_PHONE_PLACEMENT: 'accountPhonePlacement',
  BUSY_BUTTON_STYLE: 'busyButtonStyle',
  SPINNER_STYLE: 'spinnerStyle',
  HEADER_LAYOUT: 'headerLayout',
  HEADER_SUBMENU_STYLE: 'headerSubmenuStyle',
  HEADER_BAR_STYLE: 'headerBarStyle',
  LOGO_ASSET_URL: 'logoAssetUrl',
  FAVICON_ASSET_URL: 'faviconAssetUrl',
} as const satisfies Record<string, keyof TSiteConfig>;

export type TLookField = TValueOf<typeof LOOK_FIELD>;

export const LOOK_FIELDS: readonly TLookField[] = Object.values(LOOK_FIELD);
