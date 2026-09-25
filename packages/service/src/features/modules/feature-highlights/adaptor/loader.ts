import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
      [
        'modules:featureHighlights',
        `module:${id}`,
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toFeatureHighlightsModule(raw);
}
