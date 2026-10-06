import { q } from '@blog/service/sanity/query/query';
import { pageLanguagesQuery } from '@blog/service/shared/localization/page-languages/page-languages';

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
  homes: pageLanguagesQuery('page_home'),
  postIndexes: pageLanguagesQuery('page_postIndex'),
  topicIndexes: pageLanguagesQuery('page_topicIndex'),
  tagIndexes: pageLanguagesQuery('page_tagIndex'),
}));
