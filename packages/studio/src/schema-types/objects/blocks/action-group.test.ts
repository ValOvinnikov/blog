import { actionGroupSchema } from '@blog/studio/schema-types/objects/blocks/action-group';

type TCustomFn = (value: unknown) => string | true;

/**
 * `actionGroupSchema`'s object-level `validation` builder registers a
 * `rule.custom(fn)`; a minimal chainable mock rule captures that function
 * the same way other schema tests capture a document/field custom
 * validator (see `topic.test.ts`).
 */
const getSecondaryRequiresPrimaryValidator = (): TCustomFn => {
  if (!actionGroupSchema.validation) {
    throw new Error('Expected actionGroupSchema to define validation.');
  }

  let customFn: TCustomFn | undefined;

  const rule = {
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (actionGroupSchema.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected actionGroupSchema validation to register a custom() rule.',
    );
  }

  return customFn;
};

describe('actionGroupSchema validation', () => {
  it('is valid with neither a primary nor a secondary action', () => {
    const validate = getSecondaryRequiresPrimaryValidator();

    expect(validate(undefined)).toBe(true);
    expect(validate({})).toBe(true);
  });

  it('is valid with only a primary action', () => {
    const validate = getSecondaryRequiresPrimaryValidator();

    expect(validate({ primary: { label: 'Get started' } })).toBe(true);
  });

  it('is valid with a primary and a secondary action', () => {
    const validate = getSecondaryRequiresPrimaryValidator();

    expect(
      validate({
        primary: { label: 'Get started' },
        secondary: { label: 'Learn more' },
      }),
    ).toBe(true);
  });

  it('rejects a secondary action without a primary action', () => {
    const validate = getSecondaryRequiresPrimaryValidator();

    expect(validate({ secondary: { label: 'Learn more' } })).toBe(
      'A secondary action needs a primary action. Add a primary action first.',
    );
  });
});
