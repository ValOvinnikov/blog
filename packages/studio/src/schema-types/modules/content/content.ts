import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { richTextSchema } from '@blog/studio/schema-types/portable-text/rich-text/rich-text';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const contentSchema = defineType({
  name: 'module_content',
  title: 'Content',
  type: 'document',
  icon: FileText,
  fields: [
    titleField(),
    brandVariantField(),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description:
        'Page content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
      };
    },
  },
});
