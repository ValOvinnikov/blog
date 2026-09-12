import { defineField, defineType } from 'sanity';

export const headingBlockSchema = defineType({
  name: 'headingBlock',
  title: 'Heading Block',
  type: 'object',
  description: "The page's main heading and its optional supporting line.",
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
    }),
  ],
});
