import { isr, runQuery } from '@blog/service/sanity/query';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { heroModuleQuery } from './query';
import { toHeroModule } from './transformer';
import type { THeroModule } from './types';

export async function getHero(id: string): Promise<THeroModule> {
  const [raw, rawFallbackPost] = await Promise.all([
    runQuery(heroModuleQuery, {
      parameters: { id },
      ...isr(['modules:hero', `module:${id}`]),
    }),
    runQuery(heroFallbackFeaturedPostQuery, isr('posts')),
  ]);

  return toHeroModule(raw, rawFallbackPost);
}
