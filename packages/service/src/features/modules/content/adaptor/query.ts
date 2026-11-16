import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { getLocalizedArticleText } from '@shinefold/service/shared/localization/get-localized-article-text/get-localized-article-text';

export const contentModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_content')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    body: getLocalizedArticleText(sub, 'body').notNull(),
    ...moduleLayoutFragment,
  }))
  .notNull();
