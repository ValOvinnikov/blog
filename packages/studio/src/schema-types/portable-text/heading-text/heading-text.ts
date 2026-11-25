import { highlightDecorator } from '@shinefold/studio/schema-types/portable-text/decorators/decorators';
import { normalBlockStyle } from '@shinefold/studio/schema-types/portable-text/listed-text/listed-text';
import { defineArrayMember, defineType } from 'sanity';

export const headingTextSchema = defineType({
  name: 'headingText',
  title: 'Heading Text',
  type: 'array',
  description: 'One line of heading text in which words can be highlighted.',
  of: [
    defineArrayMember({
      type: 'block',
      options: { oneLine: true },
      styles: [normalBlockStyle],
      lists: [],
      marks: { decorators: [highlightDecorator], annotations: [] },
    }),
  ],
  validation: (rule) => rule.max(1).error('Keep the heading to one line.'),
});
