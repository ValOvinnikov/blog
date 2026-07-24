import { isr, runQuery } from '@blog/service/sanity/query';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { heroModuleQuery } from './query';
import { toHeroModule } from './transformer';
import type { THeroModule } from './types';

// `heroModuleQuery` dereferences `featuredPost` (via `postCardFragment`,
// which further derefs `author`/`category`) and `secondaryAction` (via
// `linkFragment`, whose `internalReference` can resolve to `blog_post`/
// `blog_category`/`page_generic`/`page_blog`) — every one of those types'
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
        'category',
        'post',
        'page_generic',
        'page_blog',
      ]),
    }),
    runQuery(
      heroFallbackFeaturedPostQuery,
      isr(['posts', 'author', 'category']),
    ),
  ]);

  return toHeroModule(raw, rawFallbackPost);
}
