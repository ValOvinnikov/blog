import { getContactForm } from '@blog/service/features/modules/contact-form/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createContactFormModuleService() {
  return {
    v1: {
      getContactForm: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getContactForm(id, tenant),
      ),
    },
  };
}
