import { type TPricePeriod } from '@blog/config/constants';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { pricingFeatureSchema } from '@blog/studio/schema-types/objects/pricing-feature/pricing-feature';
import {
  PRICING_PERIOD_TITLE,
  pricingPriceSchema,
} from '@blog/studio/schema-types/objects/pricing-price/pricing-price';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { validatePricingPricePeriodsUnique } from '@blog/studio/schema-types/validation/validate-pricing-price-periods-unique/validate-pricing-price-periods-unique';
import { validatePricingTierPriceLabelRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-price-label-required/validate-pricing-tier-price-label-required';
import { CreditCard } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const NAME_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 160;
const LABEL_MAX_LENGTH = 24;
const FOOTNOTE_MAX_LENGTH = 120;

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
    localizedOneLineTextField({
      name: 'name',
      title: 'Name',
      description: 'The plan name shown at the top of the tier.',
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Give the tier a name.')),
        rule.custom(
          validateLocalizedMaxLength(
            NAME_MAX_LENGTH,
            `Keep the name under ${NAME_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
    localizedOneLineTextField({
      name: 'description',
      title: 'Description',
      description: 'A line under the name saying who this plan is for.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            DESCRIPTION_MAX_LENGTH,
            'Long descriptions crowd a narrow card — keep it brief.',
          ),
        ),
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
    localizedOneLineTextField({
      name: 'priceLabel',
      title: 'Price Label',
      description:
        'Shown instead of a price for a tier with none, such as "Contact us".',
      validation: (rule) => [
        rule.custom(
          validateLocalizedMaxLength(
            LABEL_MAX_LENGTH,
            `Keep the label under ${LABEL_MAX_LENGTH} characters.`,
          ),
        ),
        rule.custom(validatePricingTierPriceLabelRequired),
      ],
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description:
        'What this tier includes, one line each. Every language shares the list; only the wording is translated.',
      of: [defineArrayMember({ type: pricingFeatureSchema.name })],
      validation: (rule) => rule.max(12),
    }),
    ctaButtonsField(),
    localizedOneLineTextField({
      name: 'highlightLabel',
      title: 'Highlight Label',
      description:
        'Fill this in to recommend the tier: it stands out from the others and carries this text as its badge.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            LABEL_MAX_LENGTH,
            `Keep the label under ${LABEL_MAX_LENGTH} characters.`,
          ),
        ),
    }),
    localizedOneLineTextField({
      name: 'footnote',
      title: 'Footnote',
      description: 'A short note under the tier — terms, taxes, or a caveat.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            FOOTNOTE_MAX_LENGTH,
            'A footnote is one line, not a paragraph.',
          ),
        ),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      prices: 'prices',
      highlightLabel: 'highlightLabel',
    },
    prepare({ name, prices, highlightLabel }) {
      const tierName = defaultLanguageValue(name) ?? 'Unknown';
      const firstPrice = (
        prices as TPricingTierPricePreviewItem[] | undefined
      )?.[0];
      const priceSubtitle =
        firstPrice?.amount !== undefined && firstPrice.period
          ? `${String(firstPrice.amount)} · ${PRICING_PERIOD_TITLE[firstPrice.period]}`
          : undefined;

      return {
        title:
          defaultLanguageValue(highlightLabel) === undefined
            ? tierName
            : `★ ${tierName}`,
        subtitle: priceSubtitle,
      };
    },
  },
});
