import { isr, runQuery } from '@blog/service/sanity/query';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { heroModuleQuery } from './query';
import { toHeroModule } from './transformer';
import type { THeroModule } from './types';

// `heroModuleQuery` dereferences `featuredPost` (via `postCardFragment`,
// which further derefs `author`/`topic`) and `secondaryAction` (via
// `linkFragment`, whose `internalReference` can resolve to `blog_post`/
// `blog_topic`/`page_generic`/`page_blog`) — every one of those types'
// tags must be included alongside the module's own tags (tag-scope
// contract, `sanity/query.ts`).
export async function getHero(id: string): Promise<THeroModule> {
  const [raw, rawFallbackPost] = await Promise.all([
    runQuery(heroModuleQuery, {
      parameters: { id },
      ...isr([
        'modules:hero',
        `module:${id}`,
        'posts',
        'author',
        'topic',
        'post',
        'page_generic',
        'page_blog',
      ]),
    }),
    runQuery(heroFallbackFeaturedPostQuery, isr(['posts', 'author', 'topic'])),
  ]);

  return toHeroModule(raw, rawFallbackPost);
}
