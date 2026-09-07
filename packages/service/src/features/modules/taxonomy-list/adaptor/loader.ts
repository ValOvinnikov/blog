import { TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { taxonomyListModuleQuery } from './query';
import { toTaxonomyListModule } from './transformer';
import type { TTaxonomyListModule } from './types';

function taxonomyCacheTags(fallbackTaxonomy: TTaxonomyKind | undefined) {
  if (fallbackTaxonomy === TAXONOMY_KIND.TOPICS) return ['topics'];
  if (fallbackTaxonomy === TAXONOMY_KIND.TAGS) return ['tags'];
  return ['topics', 'tags'];
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
    ...isr(
      [
        'modules:taxonomyList',
        `module:${id}`,
        ...taxonomyCacheTags(fallbackTaxonomy),
        'posts',
      ],
      tenant.projectId,
    ),
  });

  return toTaxonomyListModule(raw);
}
