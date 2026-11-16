import { NEWSLETTER_VARIANT } from '@shinefold/config';
import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { z } from 'zod';

const NEWSLETTER_VARIANT_EXPRESSION = `coalesce(variant, "${NEWSLETTER_VARIANT.FULL}")`;
const newsletterVariantParser = z.enum([
  NEWSLETTER_VARIANT.FULL,
  NEWSLETTER_VARIANT.COMPACT,
]);

export const newsletterModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_newsletter')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    content: getLocalizedField(sub, 'content'),
    variant: sub.raw(NEWSLETTER_VARIANT_EXPRESSION, newsletterVariantParser),
    trustCues: sub
      .field('trustCues[]')
      .project((cueSub) => ({
        text: getLocalizedField(cueSub, 'text'),
      }))
      .nullable(true),
    ...moduleLayoutFragment,
    ...moduleContentAlignmentLeftCenterFragment,
  }))
  .notNull();
