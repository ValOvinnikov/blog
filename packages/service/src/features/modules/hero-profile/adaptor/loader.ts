import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroProfileModuleQuery } from './query';
import { toHeroProfileModule } from './transformer';
import type { THeroProfileModule } from './types';

export async function getHeroProfile(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroProfileModule> {
  const raw = await runQuery(heroProfileModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroProfile',
        `module:${id}`,
        'author',
        'link',
        'homePage',
        'page_landing',
        'page_post',
        'page_postIndex',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
        'topic',
      ],
      tenant.projectId,
    ),
  });

  return toHeroProfileModule(raw);
}
