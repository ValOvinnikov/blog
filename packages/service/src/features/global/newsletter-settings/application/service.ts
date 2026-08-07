import { getNewsletterSettings } from '@blog/service/features/global/newsletter-settings/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createNewsletterSettingsService() {
  return {
    v1: {
      getNewsletterSettings: safeAsync(() => getNewsletterSettings()),
    },
  };
}
