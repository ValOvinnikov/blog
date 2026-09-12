import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { taxonomyListModuleQuery } from './query';
import { toTaxonomyListModule } from './transformer';
import type { TTaxonomyListModule } from './types';

/** Resolves a `module_taxonomyList` placement's authored terms and entries. */
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
