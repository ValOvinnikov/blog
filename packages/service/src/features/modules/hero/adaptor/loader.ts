import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { heroModuleQuery } from './query';
import { toHeroModule } from './transformer';
import type { THeroModule } from './types';

// `heroModuleQuery` dereferences `featuredPost` (via `postCardFragment`,
// which further derefs `author`/`topic`) and `secondaryAction` (via
// `linkFragment`, whose `internalReference` can resolve to `page_post`/
// `blog_topic`/`page_landing`/`page_blog`/`page_postIndex`) — every one of
// those types' tags must be included alongside the module's own tags
// (tag-scope contract, `sanity/query.ts`).
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
          'page_blog',
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
