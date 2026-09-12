import { defineHeroFields } from '@blog/studio/schema-types/helpers/define-hero-fields';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
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
    ...defineHeroFields(),
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
