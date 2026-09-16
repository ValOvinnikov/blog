import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { navigationQuery } from './query';
import { toNavigation } from './transformer';
import type { TNavigation } from './types';

export async function getNavigation(
  tenant: TTenantSanityContext,
): Promise<TNavigation> {
  const raw = await runQuery(navigationQuery, {
    tenant,
    ...isr(
      [
        'navigation',
        'page_post',
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
  return toNavigation(raw);
}
