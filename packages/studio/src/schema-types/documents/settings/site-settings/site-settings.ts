import { PRICE_PERIOD } from '@blog/config/constants';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { brandSchema } from '@blog/studio/schema-types/objects/brand/brand';
import { PRICING_PERIOD_TITLE } from '@blog/studio/schema-types/objects/pricing-price/pricing-price';
import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { currencyOptionList } from './currency-options';

export const siteSettingsSchema = defineType({
  name: 'settings_site',
  title: 'Site Settings',
  type: 'document',
  description: 'Site-wide identity used across every page.',
  icon: Settings,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Site settings',
    }),
  },
  fields: [
    titleField(),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: brandSchema.name,
      description:
        "The site's identity — name, logo, and optional status line — used across the header and footer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      description: 'The currency every price on the site is shown in.',
      options: {
        layout: 'dropdown',
        list: currencyOptionList,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pricePeriodSuffix',
      title: 'Price Period Wording',
      type: 'object',
      description:
        'How each period reads after a price on every pricing section, per language — for example “per month” or “/mo”. Left empty, the price shows no period.',
      options: { collapsible: true, collapsed: true },
      fields: Object.values(PRICE_PERIOD).map((period) =>
        localizedOneLineTextField({
          name: period,
          title: PRICING_PERIOD_TITLE[period],
        }),
      ),
    }),
  ],
});
