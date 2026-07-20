import { BRAND_VARIANTS } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

import { imageWithAltSchema } from './image-with-alt';

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
      name: 'prefix',
      title: 'Logo Prefix',
      type: 'string',
      description: 'Primary header wordmark text, e.g. "val".',
      validation: (rule) => rule.required().max(30),
    }),
    defineField({
      name: 'suffix',
      title: 'Logo Suffix',
      type: 'string',
      description: 'Accent suffix after the prefix, e.g. ".dev".',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: imageWithAltSchema.name,
      description: 'Site logo. SVG or high-res PNG recommended.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'specLine',
      title: 'Spec Line',
      type: 'string',
      description:
        'Optional monospace line shown below the logo — system-status/build-tag style text, editor\'s choice, e.g. "build 2026.07 · online".',
      validation: (rule) => rule.max(60),
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
