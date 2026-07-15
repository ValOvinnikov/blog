import { isr, runQuery } from '@blog/service/sanity/query';

import { blogIndexSettingsQuery } from './query';
import { toBlogIndexSettings } from './transformer';
import type { TBlogIndexSettings } from './types';

export async function getBlogIndexSettings(): Promise<TBlogIndexSettings> {
  const raw = await runQuery(blogIndexSettingsQuery, isr('page_blog'));
  return toBlogIndexSettings(raw);
}
