import { RESERVED_SLUGS } from '@blog/config/constants';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const genericSlugUrlPreviewInput = createSlugUrlPreviewInput('/');

export const genericSchema = defineType({
  name: 'page_generic',
  title: 'Landing Page',
  type: 'document',
  icon: FileText,
  preview: {
    select: {
      title: 'title',
    },
  },
  fields: [
    titleField(),
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: genericSlugUrlPreviewInput,
      validateSlug: (value) => {
        const current = value?.current;

        if (
          current &&
          (RESERVED_SLUGS as readonly string[]).includes(current)
        ) {
          return `"${current}" is a reserved path and can't be used as a page slug.`;
        }

        return true;
      },
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
