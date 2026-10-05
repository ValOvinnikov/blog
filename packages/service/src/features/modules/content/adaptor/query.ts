import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { getLocalizedArticleText } from '@blog/service/shared/localization/get-localized-article-text/get-localized-article-text';

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
