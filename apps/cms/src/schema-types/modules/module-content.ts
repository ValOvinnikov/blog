import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { richTextSchema } from '@cms/schema-types/objects/rich-text';
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
