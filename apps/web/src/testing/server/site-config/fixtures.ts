import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config/get-site-config/get-site-config';
import { faker } from '@faker-js/faker';
import { createMockFaker } from '@web/testing/mock-faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const mockFaker = createMockFaker(61063);

const MOCK_SITE_CONFIG_CREATED_AT = mockFaker.date.past();

export const mockSiteConfig = (
  overrides: Partial<TSiteConfigResult> = {},
): TSiteConfigResult => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ min: 0, max: 359 }),
  logoHue: undefined,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
  busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
  spinnerStyle: SPINNER_STYLE.PRESET,
  headerLayout: HEADER_LAYOUT.CLASSIC,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  logoAssetUrl: undefined,
  faviconAssetUrl: undefined,
  voiceOverridesByLocale: {},
  voiceOverrides: {},
  createdAt: MOCK_SITE_CONFIG_CREATED_AT,
  updatedAt: MOCK_SITE_CONFIG_CREATED_AT,
  ...overrides,
});
