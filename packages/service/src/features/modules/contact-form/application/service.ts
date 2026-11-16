import { getContactForm } from '@shinefold/service/features/modules/contact-form/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createContactFormModuleService() {
  return {
    v1: {
      getContactForm: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getContactForm(id, tenant),
      ),
    },
  };
}
