import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';

export const pricingModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_pricing')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    tiers: sub
      .field('tiers[]')
      .project((tierSub) => ({
        _key: true,
        name: getLocalizedField(tierSub, 'name').notNull(),
        description: getLocalizedField(tierSub, 'description'),
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
        priceLabel: getLocalizedField(tierSub, 'priceLabel'),
        features: tierSub
          .field('features[]')
          .project((featureSub) => ({
            _key: true,
            text: getLocalizedField(featureSub, 'text'),
          }))
          .nullable(true),
        ctaButtons: tierSub
          .field('ctaButtons[]')
          .project(ctaButtonFragment)
          .nullable(true),
        highlightLabel: getLocalizedField(tierSub, 'highlightLabel'),
        footnote: getLocalizedField(tierSub, 'footnote'),
      }))
      .notNull(),
    footnote: getLocalizedField(sub, 'footnote'),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
