import { isr } from '@blog/service/sanity/query';
import { createTaxonomyIndexPageLoader } from '@blog/service/shared/loaders/create-taxonomy-index-page-loader';

import { MissingTaxonomyListError } from './missing-taxonomy-list-error';
import { topicIndexPageQuery } from './query';
import { toTopicIndexPage } from './transformer';

export const getIndexPage = createTaxonomyIndexPageLoader({
  query: topicIndexPageQuery,
  transformer: toTopicIndexPage,
  getCacheOptions: (tenant) =>
    isr(['page_topicIndex', 'modules:taxonomyList'], tenant.projectId),
  MissingTaxonomyListError,
});
