import { getCookieSettings } from '@blog/service/features/modules/cookie-settings/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createCookieSettingsModuleService() {
  return {
    v1: {
      getCookieSettings: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getCookieSettings(id, tenant),
      ),
    },
  };
}
