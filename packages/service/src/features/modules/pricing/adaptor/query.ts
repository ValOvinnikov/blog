import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';

export const pricingModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_pricing')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    tiers: sub
      .field('tiers[]')
      .project((tierSub) => ({
        _key: true,
        name: tierSub.field('name').notNull(),
        description: tierSub.field('description').nullable(true),
        prices: tierSub
          .field('prices[]')
          .project((priceSub) => ({
            _key: true,
            period: priceSub.field('period').notNull(),
            amount: priceSub.field('amount').notNull(),
            compareAtAmount: priceSub.field('compareAtAmount').nullable(true),
            isStartingAt: priceSub.field('isStartingAt').nullable(true),
          }))
          .nullable(true),
        priceLabel: tierSub.field('priceLabel').nullable(true),
        features: tierSub.field('features[]').nullable(true),
        ctaButtons: tierSub
          .field('ctaButtons[]')
          .project(ctaButtonFragment)
          .nullable(true),
        isHighlighted: tierSub.field('isHighlighted').nullable(true),
        highlightLabel: tierSub.field('highlightLabel').nullable(true),
        footnote: tierSub.field('footnote').nullable(true),
      }))
      .notNull(),
    footnote: sub.field('footnote').nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
