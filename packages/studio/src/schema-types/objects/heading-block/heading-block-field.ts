import { defineField } from 'sanity';

import { headingBlockSchema } from './heading-block';

/**
 * The shared `headingBlock` object field. Required so the object itself is
 * always present; its nested `heading` field carries its own `required()`,
 * since Sanity never descends into an absent object to evaluate that rule.
 */
export const headingBlockField = () =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: headingBlockSchema.name,
    description:
      'The heading shown at the top of this page or module, with its optional supporting line.',
    validation: (rule) => rule.required(),
  });
