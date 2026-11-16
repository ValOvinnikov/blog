import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { taxonomyListModuleQuery } from './query';
import { toTaxonomyListModule } from './transformer';
import type { TTaxonomyListModule } from './types';

export async function getTaxonomyList(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TTaxonomyListModule> {
  const raw = await runQuery(taxonomyListModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:taxonomyList', `module:${id}`, 'topics', 'tags', 'posts'],
      tenant.projectId,
    ),
  });

  return toTaxonomyListModule(raw);
}
