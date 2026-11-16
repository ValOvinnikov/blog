import { getCookieSettings } from '@shinefold/service/features/modules/cookie-settings/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createCookieSettingsModuleService() {
  return {
    v1: {
      getCookieSettings: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getCookieSettings(id, tenant),
      ),
    },
  };
}
