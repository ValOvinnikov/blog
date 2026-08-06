import { RESERVED_SLUGS } from '@blog/config/constants';
import { defineModulesField } from '@cms/schema-types/helpers/define-modules-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { contentSchema } from '@cms/schema-types/modules/module-content';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TSlugValue = {
  current?: string;
};

export const genericSchema = defineType({
  name: 'page_generic',
  title: 'Page',
  type: 'document',
  icon: FileText,
  preview: {
    select: {
      title: 'title',
    },
  },
  fields: [
    titleField(),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) =>
        rule.required().custom((value: TSlugValue | undefined) => {
          const current = value?.current;

          if (
            current &&
            (RESERVED_SLUGS as readonly string[]).includes(current)
          ) {
            return `"${current}" is a reserved path and can't be used as a page slug.`;
          }

          return true;
        }),
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
});
