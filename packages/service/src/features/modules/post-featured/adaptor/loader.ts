import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

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
      [
        'modules:postFeatured',
        `module:${id}`,
        'posts',
        'author',
        'topic',
        ...LINK_TARGET_CACHE_TAGS,
      ],
      tenant.projectId,
    ),
  });

  return toPostFeaturedModule(raw);
}
