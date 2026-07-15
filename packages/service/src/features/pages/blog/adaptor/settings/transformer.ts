import { POSTS_PER_PAGE } from '@blog/service/features/pages/blog/adaptor/pagination';
import { toSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import type { InferResultType } from 'groqd';

import type { blogIndexSettingsQuery } from './query';
import type { TBlogIndexSettings } from './types';

export type TRawBlogIndexSettings = InferResultType<
  typeof blogIndexSettingsQuery
>;

const FALLBACK_HEADING = 'Blog';

export function toBlogIndexSettings(
  raw: TRawBlogIndexSettings,
): TBlogIndexSettings {
  if (!raw) {
    return { heading: FALLBACK_HEADING, itemsPerPage: POSTS_PER_PAGE };
  }

  return {
    heading: raw.heading,
    supportingText: raw.supportingText ?? undefined,
    itemsPerPage: raw.itemsPerPage,
    seo: raw.seo ? toSeoMeta(raw.seo) : undefined,
  };
}
