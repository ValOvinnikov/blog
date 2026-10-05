import { q } from '@blog/service/sanity/query';

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
    slug: t.field('slug.current').nullable(true),
  }));
