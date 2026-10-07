import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { defineField } from 'sanity';

import {
  HEADING_REQUIRED_MESSAGE,
  pageHeadingBlockSchema,
} from './page-heading-block';

// Sanity never evaluates the nested heading rule for an absent object.
export const pageHeadingBlockField = () => [
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: pageHeadingBlockSchema.name,
    description:
      'The heading shown at the top of this page or module, with its optional supporting line.',
    validation: (rule) =>
      rule.custom((value) =>
        value === undefined ? HEADING_REQUIRED_MESSAGE : true,
      ),
  }),
  ...alignmentFields([], {
    title: 'Heading Alignment',
    description: 'Horizontal alignment of the heading and supporting text.',
    allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
  }),
];
