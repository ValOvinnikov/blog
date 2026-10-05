import { NEWSLETTER_VARIANT } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
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
      .project(localizedHeadingBlockFragment)
      .notNull(),
    variant: sub.raw(NEWSLETTER_VARIANT_EXPRESSION, newsletterVariantParser),
    ...moduleLayoutFragment,
    ...moduleContentAlignmentFragment,
  }))
  .notNull();
