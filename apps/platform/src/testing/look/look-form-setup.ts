import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import {
  LookForm,
  type TLookFormTenant,
} from '@platform/components/features/look/look-form/look-form';
import { customRender } from '@platform/testing/custom-render';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

const MOCK_LOOK_TENANT: TLookFormTenant = {
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  siteHost: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.GROWTH,
};

export const withLookTenant = (overrides: Partial<TLookFormTenant>) => ({
  tenant: { ...MOCK_LOOK_TENANT, ...overrides },
});

export const setupLookForm = customRender(LookForm, {
  tenant: MOCK_LOOK_TENANT,
  initialValues: defaultLookFormValues(),
  isOperator: false,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
  hasCookieBanner: true,
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
