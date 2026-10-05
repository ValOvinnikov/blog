import { q } from '@blog/service/sanity/query/query';
import { homeLanguagesQuery } from '@blog/service/shared/localization/home-languages/home-languages';

export const translationMapQuery = q.project((root) => ({
  groups: root.star.filterByType('translation.metadata').project((group) => ({
    entries: group
      .field('translations[]')
      .field('value')
      .deref()
      .asCombined()
      .filterBy('slug.current != null')
      .project((target) => ({
        documentType: target.field('_type'),
        language: target.field('language').nullable(true),
        slug: target.field('slug.current').nullable(true),
      }))
      .nullable(true),
  })),
  homes: homeLanguagesQuery,
}));
