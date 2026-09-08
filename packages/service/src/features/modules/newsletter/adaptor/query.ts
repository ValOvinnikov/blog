import { NEWSLETTER_VARIANT } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { requiredSectionHeaderFragment } from '@blog/service/shared/fragments/section-header';
import { z } from 'zod';

const NEWSLETTER_VARIANT_EXPRESSION = `coalesce(variant, "${NEWSLETTER_VARIANT.FULL}")`;
const newsletterVariantParser = z.enum([
  NEWSLETTER_VARIANT.FULL,
  NEWSLETTER_VARIANT.COMPACT,
]);

export const newsletterModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_newsletter')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .notNull(),
    variant: sub.raw(NEWSLETTER_VARIANT_EXPRESSION, newsletterVariantParser),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }))
  .notNull();
