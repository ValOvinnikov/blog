import { defineField, defineType } from 'sanity';

export const socialLinkSchema = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  description:
    'A link to one social media profile, together with its platform name.',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description:
        'Social platform name (e.g. "Twitter", "GitHub", "LinkedIn").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Full profile URL including https://.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'platform', subtitle: 'url' },
  },
});
