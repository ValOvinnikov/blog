import { heroFields } from '@blog/studio/schema-types/fields/hero-fields/hero-fields';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { Quote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const heroStatementSchema = defineType({
  name: 'module_heroStatement',
  title: 'Statement Hero',
  type: 'document',
  icon: Quote,
  fields: [
    titleField(),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Optional small line above the heading.',
    }),
    headingBlockField({
      requireHeading: true,
      requiredMessage: 'A statement hero is its heading. Give it one.',
    }),
    ...heroFields(),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: subtitle ? String(subtitle) : 'No heading yet',
      };
    },
  },
});
