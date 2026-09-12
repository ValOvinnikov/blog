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
      description: 'The heading text shown to readers.',
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      description:
        'Optional line of supporting text shown beneath the heading.',
    }),
  ],
});
