import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { featureListModuleQuery } from './query';
import { toFeatureListModule } from './transformer';
import type { TFeatureListModule } from './types';

export async function getFeatureList(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TFeatureListModule> {
  const raw = await runQuery(featureListModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:featureList',
        `module:${id}`,
        'block_feature',
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toFeatureListModule(raw);
}
