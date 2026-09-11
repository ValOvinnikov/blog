import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { blogPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TBlogIndexPage>> {
  const rawPage = await runQuery(blogPageQuery, {
    tenant,
    ...isr('page_blog', tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toIndexPage(rawPage);
}
