import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
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

  const settings = await getSiteSettings(tenant);
  return toIndexPage(rawPage, settings, tenant);
}
