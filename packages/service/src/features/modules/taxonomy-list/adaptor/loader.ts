import { TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import { getTags } from '@blog/service/features/entities/tags/adaptor/loader';
import { getTopics } from '@blog/service/features/entities/topics/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { taxonomyListModuleQuery } from './query';
import { toTaxonomyListModule } from './transformer';
import type { TTaxonomyListModule } from './types';

/**
 * Which taxonomy a slot lists is not authored on the module — it is
 * inferred by the caller from which index page's slot holds it, and passed
 * in here rather than re-derived by querying upward for the parent page.
 */
export async function getTaxonomyList(
  id: string,
  taxonomy: TTaxonomyKind,
): Promise<TTaxonomyListModule> {
  const [raw, entries] = await Promise.all([
    runQuery(taxonomyListModuleQuery, {
      parameters: { id },
      ...isr(['modules:taxonomyList', `module:${id}`]),
    }),
    taxonomy === TAXONOMY_KIND.TOPICS ? getTopics() : getTags(),
  ]);

  return toTaxonomyListModule(raw, entries);
}
