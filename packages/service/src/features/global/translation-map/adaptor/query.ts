import { q } from '@blog/service/sanity/query';

export const translationMapQuery = q.star
  .filterByType('translation.metadata')
  .project((group) => ({
    entries: group
      .field('translations[]')
      .field('value')
      .deref()
      .filterBy('slug.current != null')
      .project((target) => ({
        documentType: target.field('_type'),
        language: target.field('language').nullable(true),
        slug: target.field('slug.current').nullable(true),
      }))
      .nullable(true),
  }));
