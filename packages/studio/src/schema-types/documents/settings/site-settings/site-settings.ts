import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { currencyOptionList } from './currency-options';

export const siteSettingsSchema = defineType({
  name: 'settings_site',
  title: 'Site Settings',
  type: 'document',
  description: 'Site-wide settings used across every page.',
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
  ],
});
