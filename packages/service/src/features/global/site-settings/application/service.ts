import { safeAsync } from '@blog/utils';

import { getSiteSettings } from '../adaptor/loader';

export function createSiteSettingsService() {
  return {
    v1: {
      getSiteSettings: () => safeAsync(getSiteSettings()),
    },
  };
}
