import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { pricingTierSchema } from '@blog/studio/schema-types/objects/pricing-tier/pricing-tier';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validatePricingSingleHighlightedTier } from '@blog/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';
import { DollarSign } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const pricingSchema = defineType({
  name: 'module_pricing',
  title: 'Pricing',
  type: 'document',
  description: 'A table of plans and their prices, used to sell an offer.',
  icon: DollarSign,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'tiers',
      title: 'Tiers',
      type: 'array',
      description:
        'The tiers, left to right. Prices use the currency set in Site Settings (change it there).',
      of: [defineArrayMember({ type: pricingTierSchema.name })],
      validation: (rule) => [
        rule.required().error('Add at least one tier.'),
        rule.min(1).error('Add at least one tier.'),
        rule.max(4).error('Pricing holds at most four tiers.'),
        rule.custom(validatePricingSingleHighlightedTier),
      ],
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description:
        'One line under the tiers — the currency, taxes, or a caveat.',
      validation: (rule) =>
        rule.max(160).error('A footnote is one line, not a paragraph.'),
    }),
    ctaButtonsField(),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, period switch, footnote and actions. Card content is always left-aligned.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      tiers: 'tiers',
    },
    prepare({ title, brandVariant, tiers }) {
      const count = Array.isArray(tiers) ? tiers.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} tier${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
