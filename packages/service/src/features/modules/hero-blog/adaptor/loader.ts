import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { heroBlogModuleQuery } from './query';
import { toHeroBlogModule } from './transformer';
import type { THeroBlogModule } from './types';

export async function getHeroBlog(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroBlogModule> {
  const raw = await runQuery(heroBlogModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroBlog',
        `module:${id}`,
        'posts',
        'author',
        'link',
        'homePage',
        'page_landing',
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

  return toHeroBlogModule(raw);
}
