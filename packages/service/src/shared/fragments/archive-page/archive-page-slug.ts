import { q } from '@blog/service/sanity/query/query';
import { z } from 'zod';

const slugParser = z.string().nullable();

export const tagArchivePageSlugFragment = q.star
  .filterByType('page_tag')
  .filterRaw('tag._ref == ^._id')
  .slice(0)
  .field('slug.current')
  .validate(slugParser);

export const topicArchivePageSlugFragment = q.star
  .filterByType('page_topic')
  .filterRaw('topic._ref == ^._id')
  .slice(0)
  .field('slug.current')
  .validate(slugParser);
