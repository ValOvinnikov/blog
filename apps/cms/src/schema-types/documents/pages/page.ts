import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { defineModulesField } from '../../helpers/define-modules-field';
import { titleField } from '../../helpers/title-field';
import { contentSchema } from '../../modules/module-content';
import { ctaSchema } from '../../modules/module-cta';
import { seoSchema } from '../../objects/seo';

export const genericSchema = defineType({
  name: 'page_generic',
  title: 'Page',
  type: 'document',
  icon: FileText,
  fields: [
    titleField({ description: 'Page headline / H1' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [contentSchema.name, ctaSchema.name],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override meta title, description, and OG image for search engines.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
});
