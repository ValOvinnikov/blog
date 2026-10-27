import { LOCALE_ISO_CODES, type ITenantLocalizedParams } from '@blog/config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const mockRouteParams = <TExtra extends object = object>(
  extra?: TExtra,
): Promise<ITenantLocalizedParams & TExtra> =>
  Promise.resolve({
    tenant: MOCK_TENANT_ID,
    locale: LOCALE_ISO_CODES.EN,
    ...extra,
  } as ITenantLocalizedParams & TExtra);
