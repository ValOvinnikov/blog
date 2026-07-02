import { getSiteSettings } from '../adaptor/loader';

export function createSiteSettingsService() {
  return {
    v1: { getSiteSettings },
  };
}
