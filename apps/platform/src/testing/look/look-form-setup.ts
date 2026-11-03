import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { LookForm } from '@platform/components/features/look/look-form/look-form';
import { customRender } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export const setupLookForm = customRender(LookForm, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
  siteHost: MOCK_TENANT_DOMAIN,
  initialValues: defaultLookFormValues(),
  plan: TENANT_PLAN.GROWTH,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
  hasCookieBanner: true,
});
