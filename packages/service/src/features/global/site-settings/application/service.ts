import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createSiteSettingsService() {
  return {
    v1: {
      getSiteSettings: () => safeAsync(getSiteSettings()),
    },
  };
}
