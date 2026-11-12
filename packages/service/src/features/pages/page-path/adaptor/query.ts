import { q } from '@blog/service/sanity/query/query';
import {
  PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';

export const draftPagePathQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('page_post', 'page_landing')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    _type: true,
    path: sub.raw(PAGE_PATH_EXPRESSION, pagePathParser),
    language: sub.field('language').notNull(),
  }))
  .nullable(true);
