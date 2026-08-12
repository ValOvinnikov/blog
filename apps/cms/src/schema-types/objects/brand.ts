import { BRAND_VARIANTS } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

import { imageWithAltSchema } from './image-with-alt';
import { specLineSchema } from './spec-line';

export const brandSchema = defineType({
  name: 'brand',
  title: 'Brand',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Brand name — shown in the footer, browser tab, and RSS feed.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: imageWithAltSchema.name,
      description:
        'Site logo. SVG or high-res PNG recommended. Falls back to the default mark when unset.',
    }),
    defineField({
      name: 'specLine',
      title: 'Spec Line',
      type: specLineSchema.name,
      description:
        'Optional monospace line shown below the logo — system-status/build-tag style text, e.g. "build 2026.07 · online".',
    }),
    defineField({
      name: 'variant',
      title: 'Brand Variant',
      type: 'string',
      description:
        'Switches the site-wide accent color and logo palette between Console and Indigo.',
      options: {
        layout: 'dropdown',
        list: Object.values(BRAND_VARIANTS).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: BRAND_VARIANTS.CONSOLE,
      validation: (rule) => rule.required(),
    }),
  ],
});
