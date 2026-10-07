import { q } from '@blog/service/sanity/query/query';
import {
  PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';

export const translationsQuery = q.star
  .filterByType('translation.metadata')
  // groqd's typed filterBy rejects `references(^._id)` here because the parent scope is not typed
  .filterRaw('references(^._id)')
  .slice(0)
  .field('translations[]')
  .field('value')
  .deref()
  .asCombined()
  .filterBy('slug.current != null')
  .project((t) => ({
    language: t.field('language').nullable(true),
    slug: t.raw(PAGE_PATH_EXPRESSION, pagePathParser),
  }))
  .nullable(true);
