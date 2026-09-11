import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { defineField } from 'sanity';

export const seoField = (options: { description?: string } = {}) =>
  defineField({
    name: 'seo',
    title: 'SEO',
    type: seoSchema.name,
    description:
      options.description ??
      'Meta title, description, and social sharing image for search engines.',
    validation: (rule) => rule.required(),
  });
