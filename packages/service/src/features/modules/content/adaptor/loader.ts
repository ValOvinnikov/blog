import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

export async function getContent(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TContentModule> {
  // `contentModuleQuery`'s body resolves `linkRef` marks through `link`
  // documents, which can target any page type — every one rides alongside.
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
