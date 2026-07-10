import { defineField, defineType } from 'sanity';

export default defineType({
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
      type: 'imageWithAlt',
      description: 'Site logo. SVG or high-res PNG recommended.',
      validation: (rule) => rule.required(),
    }),
  ],
});
