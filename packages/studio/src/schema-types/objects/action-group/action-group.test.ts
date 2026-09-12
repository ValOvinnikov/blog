import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import {
  actionGroupSchema,
  ctaActionSchema,
} from '@blog/studio/schema-types/objects/action-group/action-group';
import { toTitleCase } from '@blog/utils/primitives';

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

    expect(validate([{ variant: CTA_ACTION_VARIANT.PRIMARY }])).toBe(true);
  });

  it('is valid with Primary followed by Secondary', () => {
    const validate = getActionsValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.SECONDARY },
      ]),
    ).toBe(true);
  });

  it('rejects a Secondary action alone', () => {
    const validate = getActionsValidator();

    expect(validate([{ variant: CTA_ACTION_VARIANT.SECONDARY }])).toBe(
      'A Primary action is required and must be first.',
    );
  });

  it('rejects two Primary actions', () => {
    const validate = getActionsValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
      ]),
    ).toBe('Each action variant (Primary, Secondary) can be used only once.');
  });

  it('rejects Secondary before Primary', () => {
    const validate = getActionsValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.SECONDARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
      ]),
    ).toBe('A Primary action is required and must be first.');
  });

  it('rejects three actions', () => {
    const validate = getActionsValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.SECONDARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
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

describe('ctaActionSchema control choices', () => {
  const getField = (name: string) => {
    const field = ctaActionSchema.fields.find(
      (field): field is typeof field & { name: string } =>
        'name' in field && field.name === name,
    );

    if (!field) {
      throw new Error(`Expected ctaActionSchema to define a "${name}" field.`);
    }

    return field;
  };

  const getLayout = (field: { options?: unknown }) => {
    const options = field.options;

    return options && typeof options === 'object' && 'layout' in options
      ? (options as { layout?: string }).layout
      : undefined;
  };

  const getOptionValues = (field: { options?: unknown }) => {
    const options = field.options;
    const list =
      options && typeof options === 'object' && 'list' in options
        ? (options as { list: unknown }).list
        : undefined;

    if (!list) {
      throw new Error('Expected field to define an options.list.');
    }

    return list as { title: string; value: string }[];
  };

  it('keeps variant as a radio: required, and picking it sets which sibling variant is unavailable', () => {
    const field = getField('variant');

    expect(getLayout(field)).toBe('radio');
    expect(getOptionValues(field)).toEqual(
      Object.values(CTA_ACTION_VARIANT).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    );
  });

  it('converts appearance to a dropdown: optional, no field depends on it', () => {
    const field = getField('appearance');

    expect(getLayout(field)).toBe('dropdown');
    expect(getOptionValues(field)).toEqual(
      Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    );
  });
});
