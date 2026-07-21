import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { postDetailQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(slug: string): Promise<TPostDetail | null> {
  const [raw, settings] = await Promise.all([
    runQuery(postDetailQuery, {
      parameters: { slug },
      ...isr('post'),
    }),
    getSiteSettings(),
  ]);
  if (!raw) return null;
  return toPostDetail(raw, settings);
}
