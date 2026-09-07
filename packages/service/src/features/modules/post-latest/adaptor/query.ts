import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { sectionHeaderFragment } from '@blog/service/shared/fragments/section-header';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/fragments/show-images';

export const postLatestModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postLatest')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project(sectionHeaderFragment)
      .nullable(true),
    limit: sub.field('limit').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
  }))
  .notNull();
