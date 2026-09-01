import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicsQuery } from './query';
import { toTopics } from './transformer';
import type { TTopicsList } from './types';

/** Every topic with its title/slug/description and published-post count, alphabetical by title. */
export async function getTopics(
  tenant?: TTenantSanityContext,
): Promise<TTopicsList> {
  const raw = await runQuery(topicsQuery, {
    tenant,
    ...isr(['topics', 'posts'], tenant?.projectId),
  });
  return toTopics(raw);
}
