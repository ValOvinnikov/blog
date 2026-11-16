import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';

export const pricingModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_pricing')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    tiers: sub
      .field('tiers[]')
      .project((tierSub) => ({
        _key: true,
        platformPlan: tierSub.field('platformPlan').nullable(true),
        platformPlanInterval: tierSub
          .field('platformPlanInterval')
          .nullable(true),
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
        ...ctaButtonsFragment,
        highlightLabel: getLocalizedField(tierSub, 'highlightLabel'),
        footnote: getLocalizedField(tierSub, 'footnote'),
      }))
      .notNull(),
    footnote: getLocalizedField(sub, 'footnote'),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleWideLayoutFragment,
    ...moduleAppearanceFragment,
  }))
  .notNull();
