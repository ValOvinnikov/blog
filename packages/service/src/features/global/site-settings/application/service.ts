import { getSiteSettings } from '@shinefold/service/features/global/site-settings/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createSiteSettingsService() {
  return {
    v1: {
      getSiteSettings: safeAsync((tenant: TTenantSanityContext) =>
        getSiteSettings(tenant),
      ),
    },
  };
}
