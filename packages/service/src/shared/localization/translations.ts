import { q } from '@blog/service/sanity/query';

import { TRANSLATION_METADATA_TYPE } from './translated-reference';

export const translationsQuery = q.star
  .filterByType(TRANSLATION_METADATA_TYPE)
  .filterRaw('references(^._id)')
  .slice(0)
  .field('translations[]')
  .filterRaw('defined(value->slug.current)')
  .field('value')
  .deref()
  .project((t) => ({
    language: t.field('language').nullable(true),
    slug: t.field('slug.current').nullable(true),
  }));
