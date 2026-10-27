import { CAPABILITY, type TCapability } from '@blog/config';
import type { TSettingsFeatures } from '@blog/db/schema/settings-features';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

faker.seed(61062);

const MOCK_SETTINGS_FEATURES_CREATED_AT = faker.date.past();

export const mockSettingsFeaturesRow = (
  overrides: Partial<TSettingsFeatures> = {},
): TSettingsFeatures => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: true,
  analyticsEnabled: true,
  consentBannerEnabled: true,
  contactFormEnabled: true,
  createdAt: MOCK_SETTINGS_FEATURES_CREATED_AT,
  updatedAt: MOCK_SETTINGS_FEATURES_CREATED_AT,
  ...overrides,
});

export const mockSettingsFeaturesRowEnabling = (
  enabled: readonly TCapability[],
): TSettingsFeatures =>
  mockSettingsFeaturesRow({
    commentsEnabled: enabled.includes(CAPABILITY.COMMENTS),
    ratingsEnabled: enabled.includes(CAPABILITY.RATINGS),
    bookmarksEnabled: enabled.includes(CAPABILITY.BOOKMARKS),
    newsletterEnabled: enabled.includes(CAPABILITY.NEWSLETTER),
    analyticsEnabled: enabled.includes(CAPABILITY.ANALYTICS),
    consentBannerEnabled: enabled.includes(CAPABILITY.CONSENT_BANNER),
    contactFormEnabled: enabled.includes(CAPABILITY.CONTACT_FORM),
  });
