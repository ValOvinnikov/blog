import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createSiteSettingsService() {
  return {
    v1: {
      getSiteSettings: safeAsync((tenant: TTenantSanityContext) =>
        getSiteSettings(tenant),
      ),
    },
  };
}
