import { q } from '@blog/service/sanity/query';
import { TRANSLATION_METADATA_TYPE } from '@blog/service/shared/localization/translation-metadata/translation-metadata-type';

export const translationsQuery = q.star
  .filterByType(TRANSLATION_METADATA_TYPE)
  // groqd's typed filterBy rejects `references(^._id)` here because the parent scope is not typed
  .filterRaw('references(^._id)')
  .slice(0)
  .field('translations[]')
  .field('value')
  .deref()
  .filterBy('slug.current != null')
  .project((t) => ({
    language: t.field('language').nullable(true),
    slug: t.field('slug.current').nullable(true),
  }));
