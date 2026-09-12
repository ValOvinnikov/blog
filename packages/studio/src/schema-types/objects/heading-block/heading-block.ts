import { defineField, defineType } from 'sanity';

export const headingBlockSchema = defineType({
  name: 'headingBlock',
  title: 'Heading Block',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      rows: 3,
    }),
  ],
});
