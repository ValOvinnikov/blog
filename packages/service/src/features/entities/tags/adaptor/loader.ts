import { isr, runQuery } from '@blog/service/sanity/query';

import { tagsQuery } from './query';
import { toTags } from './transformer';
import type { TTagsList } from './types';

/** Every tag with its title/slug and published-post count, alphabetical by title. */
export async function getTags(): Promise<TTagsList> {
  const raw = await runQuery(tagsQuery, isr(['tags', 'posts']));
  return toTags(raw);
}
