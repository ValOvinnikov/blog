import { actionGroupSchema } from '@blog/studio/schema-types/objects/blocks/action-group';

type TCustomFn = (value: unknown) => string | true;

/**
 * The `actions` field's `validation` builder chains `rule.max(2).custom(fn)`;
 * a minimal chainable mock rule captures `fn` the same way other schema
 * tests capture a field-level custom validator.
 */
const getActionsField = () => {
  const actionsField = actionGroupSchema.fields?.find(
    (field): field is typeof field & { name: 'actions' } =>
      'name' in field && field.name === 'actions',
  );

  if (
    !actionsField ||
    !('validation' in actionsField) ||
    !actionsField.validation
  ) {
    throw new Error(
      'Expected actionGroupSchema to define an actions field with validation.',
    );
  }

  return actionsField;
};

const getActionsValidator = (): TCustomFn => {
  const actionsField = getActionsField();

  let customFn: TCustomFn | undefined;

  const rule = {
    max: () => rule,
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (actionsField.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected actions field validation to register a custom() rule.',
    );
  }

  return customFn;
};

describe('actionGroupSchema actions validation', () => {
  it('is valid with an empty array', () => {
    const validate = getActionsValidator();

    expect(validate(undefined)).toBe(true);
    expect(validate([])).toBe(true);
  });

  it('is valid with a single Primary action', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: 'PRIMARY' }])).toBe(true);
  });

  it('is valid with Primary followed by Secondary', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: 'PRIMARY' }, { variant: 'SECONDARY' }])).toBe(
      true,
    );
  });

  it('rejects a Secondary action alone', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: 'SECONDARY' }])).toBe(
      'A Primary action is required and must be first.',
    );
  });

  it('rejects two Primary actions', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: 'PRIMARY' }, { variant: 'PRIMARY' }])).toBe(
      'Each action variant (Primary, Secondary) can be used only once.',
    );
  });

  it('rejects Secondary before Primary', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: 'SECONDARY' }, { variant: 'PRIMARY' }])).toBe(
      'A Primary action is required and must be first.',
    );
  });

  it('rejects three actions', () => {
    const validate = getActionsValidator();

    expect(
      validate([
        { variant: 'PRIMARY' },
        { variant: 'SECONDARY' },
        { variant: 'PRIMARY' },
      ]),
    ).toBe('Each action variant (Primary, Secondary) can be used only once.');
  });

  it('caps the array at 2 via rule.max(2)', () => {
    const actionsField = getActionsField();

    let maxArg: number | undefined;

    const rule = {
      max: (n: number) => {
        maxArg = n;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (actionsField.validation as any)(rule);

    expect(maxArg).toBe(2);
  });
});
