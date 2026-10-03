import { HEADING_REQUIRED_MESSAGE } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { defineField } from 'sanity';

import { localizedHeadingBlockSchema } from './localized-heading-block';

// Sanity never evaluates the nested heading rule for an absent object.
export const localizedHeadingBlockField = () =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: localizedHeadingBlockSchema.name,
    description:
      'The heading shown at the top of this module, with its optional supporting line.',
    validation: (rule) =>
      rule.custom((value) =>
        value === undefined ? HEADING_REQUIRED_MESSAGE : true,
      ),
  });
