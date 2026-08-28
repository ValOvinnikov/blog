import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@blog/studio/schema-types/helpers/section-header-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const ctaSchema = defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'document',
  icon: Megaphone,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField({ requireHeading: true }),
    defineField({
      name: 'action',
      title: 'Action',
      type: linkSchema.name,
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sectionHeader.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
