import { defineField } from 'sanity';

import { seoSchema } from './seo';

export const seoField = () =>
  defineField({
    name: 'seo',
    title: 'SEO',
    type: seoSchema.name,
    description:
      'Meta title, description, and social sharing image for search engines.',
    validation: (rule) => rule.required(),
  });
