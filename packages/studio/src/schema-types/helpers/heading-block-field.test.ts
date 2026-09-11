import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';

type TCustomFn = (
  value: { heading?: string } | undefined,
  context: { parent?: unknown },
) => string | true;

const getCustomValidator = (field: { validation?: unknown }): TCustomFn => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let customFn: TCustomFn | undefined;

  const rule = {
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error('Expected field validation to register a custom() rule.');
  }

  return customFn;
};

describe('headingBlockField', () => {
  it('defaults to the shared headingBlock object type with no validation', () => {
    const field = headingBlockField();

    expect(field.type).toBe('headingBlock');
    expect(field.validation).toBeUndefined();
  });

  it('carries a default description', () => {
    const field = headingBlockField();

    expect(field.description).toBe(
      'Optional heading and supporting text shown above this module.',
    );
  });

  it('accepts a description override', () => {
    const field = headingBlockField({ description: 'Custom copy.' });

    expect(field.description).toBe('Custom copy.');
  });

  it('blocks publish on an empty heading when required, with a default message', () => {
    const validate = getCustomValidator(
      headingBlockField({ requireHeading: true }),
    );

    expect(validate(undefined, {})).toBe('Heading is required.');
    expect(validate({ heading: '' }, {})).toBe('Heading is required.');
    expect(validate({ heading: 'Latest posts' }, {})).toBe(true);
  });

  it('carries a custom required message through the field-level rule', () => {
    const validate = getCustomValidator(
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
