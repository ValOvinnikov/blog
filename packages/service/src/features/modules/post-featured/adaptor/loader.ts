import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { postFeaturedModuleQuery } from './query';
import { toPostFeaturedModule } from './transformer';
import type { TPostFeaturedModule } from './types';

export async function getPostFeatured(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TPostFeaturedModule> {
  const raw = await runQuery(postFeaturedModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:postFeatured', `module:${id}`, 'posts', 'author', 'topic'],
      tenant.projectId,
    ),
  });

  return toPostFeaturedModule(raw);
}
