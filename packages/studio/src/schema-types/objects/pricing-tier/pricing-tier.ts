import { type TPricePeriod } from '@blog/config/constants';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import {
  PRICING_PERIOD_TITLE,
  pricingPriceSchema,
} from '@blog/studio/schema-types/objects/pricing-price/pricing-price';
import { validatePricingPricePeriodsUnique } from '@blog/studio/schema-types/validation/validate-pricing-price-periods-unique/validate-pricing-price-periods-unique';
import { validatePricingTierPriceLabelRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-price-label-required/validate-pricing-tier-price-label-required';
import { CreditCard } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

type TPricingTierPricePreviewItem = {
  amount?: number;
  period?: TPricePeriod;
};

export const pricingTierSchema = defineType({
  name: 'pricingTier',
  title: 'Tier',
  type: 'object',
  description: 'One column of the pricing table — a plan and its prices.',
  icon: CreditCard,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'The plan name shown at the top of the tier.',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'A line under the name saying who this plan is for.',
      validation: (rule) =>
        rule
          .max(160)
          .error('Long descriptions crowd a narrow card — keep it brief.'),
    }),
    defineField({
      name: 'prices',
      title: 'Prices',
      type: 'array',
      description:
        'The amounts this tier costs. Add more than one to let readers switch periods.',
      of: [defineArrayMember({ type: pricingPriceSchema.name })],
      validation: (rule) => [
        rule.max(3).error('A tier holds at most three prices.'),
        rule.custom(validatePricingPricePeriodsUnique),
      ],
    }),
    defineField({
      name: 'priceLabel',
      title: 'Price Label',
      type: 'string',
      description:
        'Shown instead of a price for a tier with none, such as "Contact us".',
      validation: (rule) => [
        rule.max(24),
        rule.custom(validatePricingTierPriceLabelRequired),
      ],
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description: 'What this tier includes, one line each.',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
      ],
      validation: (rule) => rule.max(12),
    }),
    ctaButtonsField(),
    defineField({
      name: 'isHighlighted',
      title: 'Highlighted',
      type: 'boolean',
      description: "Calls out this tier as the plan's recommended choice.",
      initialValue: false,
    }),
    defineField({
      name: 'highlightLabel',
      title: 'Highlight Label',
      type: 'string',
      description: 'The badge text shown on a highlighted tier.',
      initialValue: 'Most popular',
      hidden: ({ parent }) =>
        !(parent as { isHighlighted?: boolean } | undefined)?.isHighlighted,
      validation: (rule) => rule.max(24),
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description: 'A short note under the tier — terms, taxes, or a caveat.',
      validation: (rule) =>
        rule.max(120).error('A footnote is one line, not a paragraph.'),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      prices: 'prices',
      isHighlighted: 'isHighlighted',
    },
    prepare({ name, prices, isHighlighted }) {
      const firstPrice = (
        prices as TPricingTierPricePreviewItem[] | undefined
      )?.[0];
      const priceSubtitle =
        firstPrice?.amount !== undefined && firstPrice.period
          ? `${String(firstPrice.amount)} · ${PRICING_PERIOD_TITLE[firstPrice.period]}`
          : undefined;

      return {
        title: isHighlighted
          ? `★ ${String(name ?? 'Unknown')}`
          : String(name ?? 'Unknown'),
        subtitle: priceSubtitle,
      };
    },
  },
});
