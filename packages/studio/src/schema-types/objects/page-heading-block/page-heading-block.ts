import { defineField, defineType } from 'sanity';

export const HEADING_REQUIRED_MESSAGE = 'Add a heading.';

export const pageHeadingBlockSchema = defineType({
  name: 'pageHeadingBlock',
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
      validation: (rule) => rule.required().error(HEADING_REQUIRED_MESSAGE),
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      rows: 3,
      description:
        'Optional line of supporting text shown beneath the heading.',
    }),
  ],
});
