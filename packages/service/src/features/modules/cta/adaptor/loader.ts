import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

/** Fetches a `module_cta` document and maps it to its view-model. */
export async function getCta(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:cta',
        `module:${id}`,
        'page_post',
        'topic',
        'page_landing',
        'page_postIndex',
      ],
      tenant.projectId,
    ),
  });

  return toCtaModule(raw);
}
