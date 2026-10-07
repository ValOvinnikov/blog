import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { z } from 'zod';

const slugParser = z.string().nullable();

export const tagArchivePageSlugFragment = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_tag')
  .filterRaw('tag._ref == ^._id')
  .filterBy('language == $locale')
  .slice(0)
  .field('slug.current')
  .validate(slugParser);

export const topicArchivePageSlugFragment = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_topic')
  .filterRaw('topic._ref == ^._id')
  .filterBy('language == $locale')
  .slice(0)
  .field('slug.current')
  .validate(slugParser);
