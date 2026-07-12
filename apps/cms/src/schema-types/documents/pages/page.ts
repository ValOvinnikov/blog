import { MODULE_TYPE } from '@blog/config/constants';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { defineModulesField } from '../../helpers/define-modules-field';
import { titleField } from '../../helpers/title-field';

export const genericSchema = defineType({
  name: 'page_generic',
  title: 'Page',
  type: 'document',
  icon: FileText,
  fields: [
    titleField({ max: 120, description: 'Page headline / H1' }),
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
      allow: [MODULE_TYPE.CONTENT, MODULE_TYPE.CTA],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
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
