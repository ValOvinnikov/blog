import {
  PLATFORM_PLAN_INTERVAL,
  SELLABLE_TENANT_PLANS,
  type TPlatformPlanInterval,
  type TPricePeriod,
  type TSellableTenantPlan,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { pricingFeatureSchema } from '@shinefold/studio/schema-types/objects/pricing-feature/pricing-feature';
import {
  PRICING_PERIOD_TITLE,
  pricingPriceSchema,
} from '@shinefold/studio/schema-types/objects/pricing-price/pricing-price';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { isPricingTierLinked } from '@shinefold/studio/schema-types/validation/is-pricing-tier-linked/is-pricing-tier-linked';
import { getCanLinkPlatformPlans } from '@shinefold/studio/schema-types/validation/platform-plan-links/platform-plan-links';
import { validateDefaultLanguageFilled } from '@shinefold/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@shinefold/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { validatePricingPricePeriodsUnique } from '@shinefold/studio/schema-types/validation/validate-pricing-price-periods-unique/validate-pricing-price-periods-unique';
import { validatePricingTierPlanIntervalRequired } from '@shinefold/studio/schema-types/validation/validate-pricing-tier-plan-interval-required/validate-pricing-tier-plan-interval-required';
import { validatePricingTierPriceLabelRequired } from '@shinefold/studio/schema-types/validation/validate-pricing-tier-price-label-required/validate-pricing-tier-price-label-required';
import { isUndefined, toTitleCase } from '@shinefold/utils/primitives';
import { CreditCard } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const NAME_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 160;
const LABEL_MAX_LENGTH = 24;
const FOOTNOTE_MAX_LENGTH = 120;

const PLATFORM_PLAN_INTERVAL_TITLE: Record<TPlatformPlanInterval, string> = {
  [PLATFORM_PLAN_INTERVAL.MONTH]: 'Monthly',
  [PLATFORM_PLAN_INTERVAL.YEAR]: 'Yearly',
  [PLATFORM_PLAN_INTERVAL.MONTH_AND_YEAR]: 'Monthly and yearly',
};

type TPricingTierPricePreviewItem = {
  amount?: number;
  period?: TPricePeriod;
};

const isParentLinked = ({ parent }: { parent?: unknown }) =>
  isPricingTierLinked(parent);

type TPricingTierPreview = {
  name?: unknown;
  prices?: TPricingTierPricePreviewItem[];
  platformPlan?: TSellableTenantPlan;
  platformPlanInterval?: TPlatformPlanInterval;
  highlightLabel?: unknown;
};

const toPriceSubtitle = (
  firstPrice: TMaybeUndefined<TPricingTierPricePreviewItem>,
) =>
  !isUndefined(firstPrice?.amount) && firstPrice.period
    ? `${String(firstPrice.amount)} · ${PRICING_PERIOD_TITLE[firstPrice.period]}`
    : undefined;

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
      name: 'platformPlan',
      title: 'Platform Plan',
      type: 'string',
      description:
        'Pick a plan to show its live price, in the visitor’s currency and with any running discount, instead of typed prices.',
      options: {
        layout: 'dropdown',
        list: SELLABLE_TENANT_PLANS.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      hidden: ({ value }) => !getCanLinkPlatformPlans() && !value,
    }),
    defineField({
      name: 'platformPlanInterval',
      title: 'Billing Interval',
      type: 'string',
      description:
        'Which of the plan’s prices the tier shows. Monthly and yearly lets readers switch between them.',
      options: {
        layout: 'radio',
        list: Object.values(PLATFORM_PLAN_INTERVAL).map((value) => ({
          title: PLATFORM_PLAN_INTERVAL_TITLE[value],
          value,
        })),
      },
      hidden: (context) => !isParentLinked(context),
      validation: (rule) =>
        rule.custom(validatePricingTierPlanIntervalRequired),
    }),
    defineField({
      name: 'prices',
      title: 'Prices',
      type: 'array',
      description:
        'The amounts this tier costs. Add more than one to let readers switch periods.',
      of: [defineArrayMember({ type: pricingPriceSchema.name })],
      hidden: isParentLinked,
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
      hidden: isParentLinked,
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
      platformPlan: 'platformPlan',
      platformPlanInterval: 'platformPlanInterval',
      highlightLabel: 'highlightLabel',
    },
    prepare({
      name,
      prices,
      platformPlan,
      platformPlanInterval,
      highlightLabel,
    }: TPricingTierPreview) {
      const tierName = defaultLanguageValue(name) ?? 'Unknown';
      const priceSubtitle = platformPlan
        ? [
            toTitleCase(platformPlan),
            platformPlanInterval &&
              PLATFORM_PLAN_INTERVAL_TITLE[platformPlanInterval],
          ]
            .filter(Boolean)
            .join(' · ')
        : toPriceSubtitle(prices?.[0]);

      return {
        title: isUndefined(defaultLanguageValue(highlightLabel))
          ? tierName
          : `★ ${tierName}`,
        subtitle: priceSubtitle,
      };
    },
  },
});
