import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

export const MOCK_LOGO_URL =
  'https://example.blob.vercel-storage.com/brand-logo.png';
export const MOCK_FAVICON_URL =
  'https://example.blob.vercel-storage.com/favicon.png';
export const CURRENT_LOGO = 'Current logo';
export const UPLOAD_LOGO = 'Upload logo';
export const REPLACE_LOGO = 'Replace logo';
export const MOCK_STAGED_LOGO_BLOB_URL = 'blob:staged-logo';

export const MOCK_THEME_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

export const MOCK_SITE_CONFIG_UPDATED_AT = new Date('2026-08-20T09:00:00.000Z');

export const mockSiteConfig = (
  overrides: Partial<TSiteConfigResult> = {},
): TSiteConfigResult => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  ...MOCK_THEME_FIELDS,
  logoHue: undefined,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
  logoAssetUrl: undefined,
  faviconAssetUrl: undefined,
  voiceOverridesByLocale: {},
  voiceOverrides: {},
  createdAt: MOCK_SITE_CONFIG_UPDATED_AT,
  updatedAt: MOCK_SITE_CONFIG_UPDATED_AT,
  ...overrides,
});
