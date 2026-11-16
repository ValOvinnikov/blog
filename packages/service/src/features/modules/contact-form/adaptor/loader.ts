import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { contactFormModuleQuery } from './query';
import { toContactFormModule } from './transformer';
import type { TContactFormModule } from './types';

export async function getContactForm(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TContactFormModule> {
  const raw = await runQuery(contactFormModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:contactForm', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toContactFormModule(raw);
}
