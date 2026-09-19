import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
          'page_post',
          'page_landing',
          'page_postIndex',
        ],
        tenant.projectId,
      ),
    }),
    runQuery(heroFallbackFeaturedPostQuery, {
      tenant,
      ...isr(['posts', 'author', 'topic'], tenant.projectId),
    }),
  ]);

  return toHeroModule(raw, rawFallbackPost);
}
