import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroBlogModuleQuery } from './query';
import { toHeroBlogModule } from './transformer';
import type { THeroBlogModule } from './types';

// The tags below cover every document type the query derefs: the resolved
// post's author/topic, and every page type a `ctaButtons` link can target.
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

  return toHeroBlogModule(raw);
}
