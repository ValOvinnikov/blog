import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { headingBlockField } from './heading-block-field';

type TCustomFn = (
  value: { heading?: string } | undefined,
  context: { parent?: unknown },
) => string | true;

describe('headingBlockField', () => {
  it('defaults to the shared headingBlock object type', () => {
    const field = headingBlockField();

    expect(field.type).toBe('headingBlock');
  });

  it('carries the shared description', () => {
    const field = headingBlockField();

    expect(field.description).toBe(
      'The heading shown at the top of this page or module, with its optional supporting line.',
    );
  });

  it('blocks publish on an empty heading, with a default message', () => {
    const validate = getCustomValidator<TCustomFn>(headingBlockField());

    expect(validate(undefined, {})).toBe('Heading is required.');
    expect(validate({ heading: '' }, {})).toBe('Heading is required.');
    expect(validate({ heading: 'Latest posts' }, {})).toBe(true);
  });
});
