import { NEWSLETTER_VARIANT } from '@blog/config';
import { q, type TIdParams } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { z } from 'zod';

const NEWSLETTER_VARIANT_EXPRESSION = `coalesce(variant, "${NEWSLETTER_VARIANT.FULL}")`;
const newsletterVariantParser = z.enum([
  NEWSLETTER_VARIANT.FULL,
  NEWSLETTER_VARIANT.COMPACT,
]);

export const newsletterModuleQuery = q
  .parameters<TIdParams>()
  .star.filterByType('module_newsletter')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    variant: sub.raw(NEWSLETTER_VARIANT_EXPRESSION, newsletterVariantParser),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }))
  .notNull();
