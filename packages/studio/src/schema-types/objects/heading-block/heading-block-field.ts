import { defineField } from 'sanity';

import { headingBlockSchema } from './heading-block';

type THeadingBlockValue = { heading?: string };

const DEFAULT_REQUIRED_HEADING_MESSAGE = 'Heading is required.';

/**
 * The shared `headingBlock` object field. `requireHeading` adds a
 * field-level rule blocking publish on an empty nested `heading`, with an
 * optional `requiredMessage` override — requiredness lives on the field,
 * not on a second registered type.
 */
export const headingBlockField = (
  options: {
    requireHeading?: boolean;
    description?: string;
    requiredMessage?: string;
  } = {},
) =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: headingBlockSchema.name,
    description:
      options.description ??
      'Optional heading and supporting text shown above this module.',
    validation: options.requireHeading
      ? (rule) =>
          rule.custom((value: THeadingBlockValue | undefined) =>
            value?.heading
              ? true
              : (options.requiredMessage ?? DEFAULT_REQUIRED_HEADING_MESSAGE),
          )
      : undefined,
  });
