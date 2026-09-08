import { TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { taxonomyListModuleQuery } from './query';
import { toTaxonomyListModule } from './transformer';
import type { TTaxonomyListModule } from './types';

function getTaxonomyListCacheOptions(
  id: string,
  projectId: string,
  fallbackTaxonomy: TTaxonomyKind | undefined,
) {
  if (fallbackTaxonomy === TAXONOMY_KIND.TOPICS) {
    return isr(
      ['modules:taxonomyList', `module:${id}`, 'topics', 'posts'],
      projectId,
    );
  }
  if (fallbackTaxonomy === TAXONOMY_KIND.TAGS) {
    return isr(
      ['modules:taxonomyList', `module:${id}`, 'tags', 'posts'],
      projectId,
    );
  }
  return isr(
    ['modules:taxonomyList', `module:${id}`, 'topics', 'tags', 'posts'],
    projectId,
  );
}

/** Resolves a `module_taxonomyList` placement's authored terms, falling back to `fallbackTaxonomy` when the module has none authored. */
export async function getTaxonomyList(
  id: string,
  tenant: TTenantSanityContext,
  fallbackTaxonomy?: TTaxonomyKind,
): Promise<TTaxonomyListModule> {
  const raw = await runQuery(taxonomyListModuleQuery, {
    parameters: { id, fallbackTaxonomy: fallbackTaxonomy ?? null },
    tenant,
    ...getTaxonomyListCacheOptions(id, tenant.projectId, fallbackTaxonomy),
  });

  return toTaxonomyListModule(raw);
}
