import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

export async function getFooter(
  tenant: TTenantSanityContext,
): Promise<TFooter> {
  const raw = await runQuery(footerQuery, {
    tenant,
    ...isr(
      [
        'footer',
        'page_post',
        'topic',
        'page_landing',
        'page_postIndex',
        'link',
        'homePage',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
      ],
      tenant.projectId,
    ),
  });
  return toFooter(raw);
}
