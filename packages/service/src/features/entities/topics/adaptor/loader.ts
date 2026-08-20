import { isr, runQuery } from '@blog/service/sanity/query';

import { topicsQuery } from './query';
import { toTopics } from './transformer';
import type { TTopicsList } from './types';

/** Every topic with its title/slug/description and published-post count, alphabetical by title. */
export async function getTopics(): Promise<TTopicsList> {
  const raw = await runQuery(topicsQuery, isr(['topics', 'posts']));
  return toTopics(raw);
}
