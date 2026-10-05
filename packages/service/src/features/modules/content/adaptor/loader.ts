import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

export async function getContent(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TContentModule> {
  const raw = await runQuery(contentModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:content',
        `module:${id}`,
        'link',
        'homePage',
        'page_landing',
        'page_post',
        'page_postIndex',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
      ],
      tenant.projectId,
    ),
  });

  return toContentModule(raw);
}
