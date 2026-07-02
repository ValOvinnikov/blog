import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Link text shown in the navigation bar.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Href',
      type: 'string',
      description:
        'Path or URL the link points to (e.g. "/blog" or "https://...").',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
});
