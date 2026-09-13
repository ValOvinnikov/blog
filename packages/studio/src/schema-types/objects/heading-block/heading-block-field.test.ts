import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { headingBlockField } from './heading-block-field';

type TCustomFn = (
  value: { heading?: string } | undefined,
  context: { parent?: unknown },
) => string | true;

describe('headingBlockField', () => {
  it('defaults to the shared headingBlock object type with no validation', () => {
    const field = headingBlockField();

    expect(field.type).toBe('headingBlock');
    expect(field.validation).toBeUndefined();
  });

  it('carries a default description', () => {
    const field = headingBlockField();

    expect(field.description).toBe(
      'The heading shown at the top of this page or module, with its optional supporting line.',
    );
  });

  it('accepts a description override', () => {
    const field = headingBlockField({ description: 'Custom copy.' });

    expect(field.description).toBe('Custom copy.');
  });

  it('blocks publish on an empty heading when required, with a default message', () => {
    const validate = getCustomValidator<TCustomFn>(
      headingBlockField({ requireHeading: true }),
    );

    expect(validate(undefined, {})).toBe('Heading is required.');
    expect(validate({ heading: '' }, {})).toBe('Heading is required.');
    expect(validate({ heading: 'Latest posts' }, {})).toBe(true);
  });

  it('carries a custom required message through the field-level rule', () => {
    const validate = getCustomValidator<TCustomFn>(
      headingBlockField({
        requireHeading: true,
        requiredMessage: 'A statement hero is its heading. Give it one.',
      }),
    );

    expect(validate(undefined, {})).toBe(
      'A statement hero is its heading. Give it one.',
    );
  });
});
