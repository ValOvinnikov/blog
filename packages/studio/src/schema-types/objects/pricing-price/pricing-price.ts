import { PRICE_PERIOD, type TPricePeriod } from '@blog/config/constants';
import { validatePricingCompareAtAboveAmount } from '@blog/studio/schema-types/validation/validate-pricing-compare-at-above-amount/validate-pricing-compare-at-above-amount';
import { Banknote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const PRICING_PERIOD_TITLE: Record<TPricePeriod, string> = {
  [PRICE_PERIOD.ONE_TIME]: 'One-time',
  [PRICE_PERIOD.HOUR]: 'Per hour',
  [PRICE_PERIOD.SESSION]: 'Per session',
  [PRICE_PERIOD.MONTH]: 'Per month',
  [PRICE_PERIOD.YEAR]: 'Per year',
};

export const pricingPriceSchema = defineType({
  name: 'pricingPrice',
  title: 'Price',
  type: 'object',
  description: 'One amount and the period it recurs on, within a tier.',
  icon: Banknote,
  fields: [
    defineField({
      name: 'period',
      title: 'Period',
      type: 'string',
      description: 'How often this amount is charged.',
      options: {
        layout: 'dropdown',
        list: Object.values(PRICE_PERIOD).map((value) => ({
          title: PRICING_PERIOD_TITLE[value],
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'number',
      description:
        'The price to display. Uses the currency set in Site Settings.',
      validation: (rule) => rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'compareAtAmount',
      title: 'Compare-at Amount',
      type: 'number',
      description:
        'Optional. A higher amount shown struck through beside the price, to display a discount.',
      validation: (rule) =>
        rule.precision(2).custom(validatePricingCompareAtAboveAmount),
    }),
    defineField({
      name: 'isStartingAt',
      title: 'Starting At',
      type: 'boolean',
      description:
        'Shows "Starting at" before the amount, for a price that can vary.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      amount: 'amount',
      period: 'period',
    },
    prepare({ amount, period }) {
      const periodTitle =
        typeof period === 'string'
          ? PRICING_PERIOD_TITLE[period as TPricePeriod]
          : undefined;

      return {
        title: typeof amount === 'number' ? String(amount) : 'Unknown',
        subtitle: periodTitle,
      };
    },
  },
});
