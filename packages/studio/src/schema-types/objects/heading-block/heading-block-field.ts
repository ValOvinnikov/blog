import { defineField } from 'sanity';

import { HEADING_REQUIRED_MESSAGE, headingBlockSchema } from './heading-block';

// Sanity never evaluates the nested heading rule for an absent object.
export const headingBlockField = () =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: headingBlockSchema.name,
    description:
      'The heading shown at the top of this page or module, with its optional supporting line.',
    validation: (rule) =>
      rule.custom((value) =>
        value === undefined ? HEADING_REQUIRED_MESSAGE : true,
      ),
  });
