import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config/get-site-config/get-site-config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const MOCK_SITE_CONFIG_CREATED_AT = faker.date.past();

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
  logoAssetUrl: undefined,
  faviconAssetUrl: undefined,
  voiceOverridesByLocale: {},
  voiceOverrides: {},
  createdAt: MOCK_SITE_CONFIG_CREATED_AT,
  updatedAt: MOCK_SITE_CONFIG_CREATED_AT,
  ...overrides,
});
