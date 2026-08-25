import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { getRelatedPosts } from '@blog/service/features/pages/post/adaptor/related/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { postPageQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(slug: string): Promise<TPostDetail | undefined> {
  // `postPageQuery` derefs `post`, which itself derefs `author`/`topic` —
  // all three tags must ride alongside `page_post` (tag-scope contract,
  // `sanity/query.ts`).
  const rawPage = await runQuery(postPageQuery, {
    parameters: { slug },
    ...isr(['page_post', 'post', 'author', 'topic']),
  });
  if (!rawPage) return undefined;

  const tagIds = (rawPage.post.tags ?? []).map((tag) => tag._id);
  const [settings, relatedPosts] = await Promise.all([
    getSiteSettings(),
    getRelatedPosts(rawPage.post._id, tagIds, rawPage.post.topic._id),
  ]);

  return toPostDetail(rawPage, settings, relatedPosts);
}
