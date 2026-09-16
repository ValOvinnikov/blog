import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { richTextSchema } from '@blog/studio/schema-types/portable-text/rich-text/rich-text';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const contentSchema = defineType({
  name: 'module_content',
  title: 'Content',
  type: 'document',
  description:
    'A section of written content — headings, paragraphs, lists, images and code — for any page that needs prose between its other modules.',
  icon: FileText,
  fields: [
    titleField(),
    brandVariantField(),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description: 'The text itself, with images and code blocks as needed.',
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
    },
    prepare({ title, brandVariant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant),
      };
    },
  },
});
