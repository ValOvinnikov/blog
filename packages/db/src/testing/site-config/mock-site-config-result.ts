import {
  COLOR_MODE,
  LANGUAGE_SWITCHER_STYLE,
} from '@shinefold/config/constants';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config/get-site-config';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';
import {
  MOCK_SITE_CONFIG_FIELDS,
  UNSET_OPTIONAL_COLUMNS,
} from '@shinefold/db/testing/site-config/fixtures';
import { presetSiteConfig } from '@shinefold/db/utils/preset-site-config/preset-site-config';

const siteConfigResultFaker = createMockFaker(60223);

export function mockSiteConfigResult(
  overrides: Partial<TSiteConfigResult> = {},
): TSiteConfigResult {
  return {
    id: siteConfigResultFaker.string.uuid(),
    tenantId: siteConfigResultFaker.string.uuid(),
    ...presetSiteConfig(MOCK_SITE_CONFIG_FIELDS.preset),
    ...MOCK_SITE_CONFIG_FIELDS,
    ...UNSET_OPTIONAL_COLUMNS,
    colorMode: COLOR_MODE.READER,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    voiceOverridesByLocale: {},
    voiceOverrides: {},
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}
