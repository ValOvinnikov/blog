import { LookForm } from '@platform/components/features/look/look-form/look-form';
import type { TLookFormFeatures } from '@platform/components/features/look/look-form/look-form-features';
import type { TLookFormTenant } from '@platform/components/features/look/look-form/look-form-tenant';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { customRender } from '@platform/testing/custom-render';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import { stubStagedImageUrl } from '@platform/testing/staged-image';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockGrantAccess,
} from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import userEvent from '@testing-library/user-event';

const MOCK_LOOK_TENANT: TLookFormTenant = {
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  siteHost: MOCK_TENANT_DOMAIN,
  grants: mockGrantAccess(),
  lookFields: PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH].lookFields,
};

const MOCK_LOOK_FEATURES: TLookFormFeatures = {
  hasReaderAccounts: true,
  hasBookmarks: true,
  hasCookieBanner: true,
};

export const withLookTenant = (overrides: Partial<TLookFormTenant>) => ({
  tenant: { ...MOCK_LOOK_TENANT, ...overrides },
});

export const withLookFeatures = (overrides: Partial<TLookFormFeatures>) => ({
  features: { ...MOCK_LOOK_FEATURES, ...overrides },
});

export const withLookPlan = (plan: TTenantPlan) =>
  withLookTenant({ lookFields: PLAN_ENTITLEMENTS[plan].lookFields });

export const setupLookForm = customRender(LookForm, {
  tenant: MOCK_LOOK_TENANT,
  initialValues: defaultLookFormValues(),
  isOperator: false,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  features: MOCK_LOOK_FEATURES,
});

export const setupWithSavedLogo = () =>
  setupLookForm({
    initialValues: { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } },
  });

export const setupArchived = (
  overrides: Parameters<typeof setupLookForm>[0] = {},
) =>
  setupLookForm({
    ...overrides,
    ...withLookTenant({ archivedAt: MOCK_ARCHIVED_AT, ...overrides.tenant }),
  });

export const prepareBrandImageForm = () => {
  vi.mocked(uploadBrandAssetAction).mockReset();
  stubStagedImageUrl();
  return userEvent.setup();
};

export const setupLookFormWithFailingUpload = () => {
  vi.mocked(uploadBrandAssetAction).mockResolvedValue({
    outcome: ACTION_OUTCOME.SERVER_ERROR,
  });
  setupLookForm();
};
