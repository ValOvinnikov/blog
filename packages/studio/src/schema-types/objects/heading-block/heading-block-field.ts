import { defineField } from 'sanity';

import { headingBlockSchema } from './heading-block';

type THeadingBlockValue = { heading?: string };

const DEFAULT_REQUIRED_HEADING_MESSAGE = 'Heading is required.';

const DEFAULT_HEADING_BLOCK_DESCRIPTION =
  'The heading shown at the top of this page or module, with its optional supporting line.';

/**
 * The shared `headingBlock` object field. A nested `heading` is always
 * required to publish — requiredness lives on the field, not on a second
 * registered type.
 */
export const headingBlockField = () =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: headingBlockSchema.name,
    description: DEFAULT_HEADING_BLOCK_DESCRIPTION,
    validation: (rule) =>
      rule.custom((value: THeadingBlockValue | undefined) =>
        value?.heading ? true : DEFAULT_REQUIRED_HEADING_MESSAGE,
      ),
  });
