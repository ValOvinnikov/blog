import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { postPageQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TPostDetail>> {
  // `postPageQuery` derefs `author`/`topic`/`tags[]`, and its body/bio
  // `linkRef` marks resolve through `link` documents targeting any page
  // type — every one of those tags rides alongside `page_post`.
  const raw = await runQuery(postPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(
      [
        'page_post',
        'author',
        'topic',
        'tag',
        'link',
        'homePage',
        'page_landing',
        'page_postIndex',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
      ],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return toPostDetail(raw);
}
