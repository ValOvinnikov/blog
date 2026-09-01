import { getNewsletterSettings } from '@blog/service/features/global/newsletter-settings/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createNewsletterSettingsService() {
  return {
    v1: {
      getNewsletterSettings: safeAsync((tenant?: TTenantSanityContext) =>
        getNewsletterSettings(tenant),
      ),
    },
  };
}
