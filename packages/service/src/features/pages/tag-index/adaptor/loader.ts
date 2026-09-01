import { createTaxonomyIndexPageLoader } from '@blog/service/shared/loaders/create-taxonomy-index-page-loader';

import { MissingTaxonomyListError } from './missing-taxonomy-list-error';
import { tagIndexPageQuery } from './query';
import { toTagIndexPage } from './transformer';

export const getIndexPage = createTaxonomyIndexPageLoader({
  query: tagIndexPageQuery,
  transformer: toTagIndexPage,
  tags: ['page_tagIndex', 'modules:taxonomyList'],
  MissingTaxonomyListError,
});
