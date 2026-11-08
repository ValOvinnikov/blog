import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { expandableSectionTextSchema } from '@blog/studio/schema-types/portable-text/expandable-section-text/expandable-section-text';
import { ListCollapse } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const expandableSectionSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION,
  title: 'Expandable Section',
  type: 'object',
  description:
    'A titled section the reader opens to see its content, for layered notices in long texts.',
  icon: ListCollapse,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'A short heading naming what the section holds — readers see it before they open the section.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: expandableSectionTextSchema.name,
      description: 'The detail readers see once they open the section.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return {
        title: title || 'Untitled section',
        subtitle: 'Expandable section',
      };
    },
  },
});
