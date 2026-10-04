import { q } from '@blog/service/sanity/query';
import { TRANSLATION_METADATA_TYPE } from '@blog/service/shared/localization/translation-metadata/translation-metadata-type';

export const translationMapQuery = q.star
  .filterByType(TRANSLATION_METADATA_TYPE)
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
