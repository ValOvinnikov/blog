import { HEADING_REQUIRED_MESSAGE } from '@blog/studio/schema-types/objects/page-heading-block/page-heading-block';
import { defineField } from 'sanity';

import { moduleHeadingBlockSchema } from './module-heading-block';

// Sanity never evaluates the nested heading rule for an absent object.
export const moduleHeadingBlockField = ({ isRequired = true } = {}) =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: moduleHeadingBlockSchema.name,
    description: isRequired
      ? 'The heading shown at the top of this module, with its optional supporting line.'
      : 'An optional heading shown at the top of this module, with its optional supporting line.',
    validation: (rule) =>
      rule.custom((value) =>
        isRequired && value === undefined ? HEADING_REQUIRED_MESSAGE : true,
      ),
  });
