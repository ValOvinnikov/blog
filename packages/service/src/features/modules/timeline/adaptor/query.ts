import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { paragraphTextBlockFragment } from '@blog/service/shared/fragments/portable-text/paragraph-text-block';

export const timelineModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_timeline')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    markerStyle: sub.field('markerStyle').notNull(),
    items: sub
      .field('items[]')
      .project((itemSub) => ({
        _key: true,
        marker: itemSub.field('marker').nullable(true),
        heading: itemSub.field('heading').notNull(),
        body: itemSub
          .field('body[]')
          .project(paragraphTextBlockFragment)
          .nullable(true),
      }))
      .notNull(),
    orientation: sub.field('orientation').notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    itemAlignment: sub.field('itemAlignment').notNull(),
    ...moduleLayoutFragment,
  }))
  .notNull();
