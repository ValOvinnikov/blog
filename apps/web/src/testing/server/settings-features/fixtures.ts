import { faker } from '@faker-js/faker';
import { CAPABILITY, type TCapability } from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import type { TSettingsFeatures } from '@shinefold/db/schema/settings-features';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { createMockFaker } from '@web/testing/mock-faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const mockFaker = createMockFaker(61062);

const MOCK_SETTINGS_FEATURES_CREATED_AT = mockFaker.date.past();

export const mockSettingsFeaturesRow = (
  overrides: Partial<TSettingsFeatures> = {},
): TSettingsFeatures => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  readerAccountsEnabled: true,
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
    readerAccountsEnabled: enabled.includes(CAPABILITY.READER_ACCOUNTS),
    commentsEnabled: enabled.includes(CAPABILITY.COMMENTS),
    ratingsEnabled: enabled.includes(CAPABILITY.RATINGS),
    bookmarksEnabled: enabled.includes(CAPABILITY.BOOKMARKS),
    newsletterEnabled: enabled.includes(CAPABILITY.NEWSLETTER),
    analyticsEnabled: enabled.includes(CAPABILITY.ANALYTICS),
    consentBannerEnabled: enabled.includes(CAPABILITY.CONSENT_BANNER),
    contactFormEnabled: enabled.includes(CAPABILITY.CONTACT_FORM),
  });

export const mockTenantEntitlements = (
  plan: TTenantPlan = TENANT_PLAN.GROWTH,
  grants: readonly TResolvableGrant[] = [],
): TTenantEntitlements =>
  resolveTenantEntitlements(plan, grants, MOCK_SETTINGS_FEATURES_CREATED_AT);

export const mockEntitlementGrant = (
  overrides: Partial<TResolvableGrant> = {},
): TResolvableGrant => ({
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.CONTACT_FORM,
  value: null,
  expiresAt: null,
  revokedAt: null,
  ...overrides,
});
