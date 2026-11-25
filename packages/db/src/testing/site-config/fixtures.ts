import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  DIVIDER_WIDTH,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HEADING_CASE,
  HEADING_WEIGHT,
  HUE_MAX,
  HUE_MIN,
  IMAGE_PROPORTION,
  NAV_LINK_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@shinefold/config/constants';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config/get-site-config';
import type { TUpdateSiteConfigInput } from '@shinefold/db/queries/site-config/upsert-site-config';
import * as schema from '@shinefold/db/schema';
import type { TSiteConfig } from '@shinefold/db/schema/site-config';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const siteConfigFaker = createMockFaker(60222);

const HUE_HEADROOM_BELOW = 2;
const HUE_HEADROOM_ABOVE = 1;

export const MOCK_ACCENT_HUE = siteConfigFaker.number.int({
  min: HUE_MIN + HUE_HEADROOM_BELOW,
  max: HUE_MAX - HUE_HEADROOM_ABOVE,
});
export const MOCK_NOT_FOUND_HEADING = siteConfigFaker.lorem.words(3);

export const MOCK_SITE_CONFIG_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: MOCK_ACCENT_HUE,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
} satisfies TUpdateSiteConfigInput;

export const DEFAULT_CONTROL_STYLES = {
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
  busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
  buttonShape: BUTTON_SHAPE.ROUNDED,
  headerLayout: HEADER_LAYOUT.CLASSIC,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  headerBackground: BRAND_VARIANT.PRIMARY,
  breadcrumbBackground: BRAND_VARIANT.PRIMARY,
  headerControlShape: HEADER_CONTROL_SHAPE.ROUND,
  navLinkStyle: NAV_LINK_STYLE.PLAIN,
  headingWeight: HEADING_WEIGHT.MEDIUM,
  headingCase: HEADING_CASE.AS_WRITTEN,
  imageProportion: IMAGE_PROPORTION.AS_DESIGNED,
  dividerWidth: DIVIDER_WIDTH.HAIRLINE,
  footerLayout: FOOTER_LAYOUT.COLUMNS,
  footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
  footerSurface: FOOTER_SURFACE.FULL_WIDTH,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.HIDDEN,
} satisfies Partial<TUpdateSiteConfigInput>;

export const UNSET_OPTIONAL_COLUMNS = {
  logoHue: undefined,
  brandName: undefined,
  logoAssetUrl: undefined,
  logoDarkAssetUrl: undefined,
  faviconAssetUrl: undefined,
  buttonColor: undefined,
  buttonColorDark: undefined,
  lookSavedAt: undefined,
  voiceSavedAt: undefined,
} satisfies Partial<TSiteConfigResult>;

export async function insertTestSiteConfig(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.siteConfig.$inferInsert> = {},
): Promise<TSiteConfig> {
  return firstRowOrThrow(
    await db
      .insert(schema.siteConfig)
      .values({ tenantId, ...MOCK_SITE_CONFIG_FIELDS, ...overrides })
      .returning(),
    'insertTestSiteConfig',
  );
}
