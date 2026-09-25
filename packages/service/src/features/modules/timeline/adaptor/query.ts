import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text/portable-text-mark-def';

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
          .project((blockSub) => ({
            '...': true,
            markDefs: blockSub
              .field('markDefs[]')
              .project(portableTextMarkDefFragment)
              .nullable(true),
          }))
          .nullable(true),
      }))
      .notNull(),
    orientation: sub.field('orientation').notNull(),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    itemAlignment: sub.field('itemAlignment').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
