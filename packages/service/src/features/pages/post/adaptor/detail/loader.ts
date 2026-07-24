import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { getRelatedPosts } from '@blog/service/features/pages/post/adaptor/related/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { postDetailQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(slug: string): Promise<TPostDetail | null> {
  const raw = await runQuery(postDetailQuery, {
    parameters: { slug },
    ...isr('post'),
  });
  if (!raw) return null;

  const tagIds = (raw.tags ?? []).map((tag) => tag._id);
  const [settings, relatedPosts] = await Promise.all([
    getSiteSettings(),
    getRelatedPosts(raw._id, tagIds, raw.category._id),
  ]);

  return toPostDetail(raw, settings, relatedPosts);
}
