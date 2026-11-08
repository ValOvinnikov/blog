import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { featureHighlightsModuleQuery } from './query';
import { toFeatureHighlightsModule } from './transformer';
import type { TFeatureHighlightsModule } from './types';

export async function getFeatureHighlightsModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TFeatureHighlightsModule> {
  const raw = await runQuery(featureHighlightsModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:featureHighlights', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toFeatureHighlightsModule(raw);
}
