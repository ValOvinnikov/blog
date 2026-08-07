import { getNewsletter } from '@blog/service/features/modules/newsletter/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createNewsletterModuleService() {
  return {
    v1: { getNewsletter: safeAsync((id: string) => getNewsletter(id)) },
  };
}
