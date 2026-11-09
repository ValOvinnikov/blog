import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { heroModuleQuery } from './query';
import { toHeroModule } from './transformer';
import type { THeroModule } from './types';

export async function getHero(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroModule> {
  const [raw, rawFallbackPost] = await Promise.all([
    runQuery(heroModuleQuery, {
      parameters: { id },
      tenant,
      ...isr(
        [
          'modules:hero',
          `module:${id}`,
          'posts',
          'author',
          'topic',
          ...LINK_TARGET_CACHE_TAGS,
        ],
        tenant.projectId,
      ),
    }),
    runQuery(heroFallbackFeaturedPostQuery, {
      tenant,
      ...isr(
        ['posts', 'author', 'topic', ...LINK_TARGET_CACHE_TAGS],
        tenant.projectId,
      ),
    }),
  ]);

  return toHeroModule(raw, rawFallbackPost);
}
