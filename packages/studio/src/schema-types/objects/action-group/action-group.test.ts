import { CTA_ACTION_VARIANT } from '@blog/config/constants';
import { actionGroupSchema } from '@blog/studio/schema-types/objects/action-group/action-group';
import { getRecordedValidators } from '@blog/studio/testing/create-mock-validation-rule';

type TCustomFn = (value: unknown) => string | true;

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

const getPrimaryFirstValidator = (): TCustomFn => {
  const validators = getRecordedValidators<TCustomFn>(getActionsField());
  const validator = validators.at(-1);

  if (!validator) {
    throw new Error(
      'Expected actions to register a Primary-first custom() rule.',
    );
  }

  return validator.fn;
};

describe('actionGroupSchema actions validation', () => {
  it('is valid with an empty array', () => {
    const validate = getPrimaryFirstValidator();

    expect(validate(undefined)).toBe(true);
    expect(validate([])).toBe(true);
  });

  it('is valid with a single Primary action', () => {
    const validate = getPrimaryFirstValidator();

    expect(validate([{ variant: CTA_ACTION_VARIANT.PRIMARY }])).toBe(true);
  });

  it('is valid with Primary followed by Secondary', () => {
    const validate = getPrimaryFirstValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.SECONDARY },
      ]),
    ).toBe(true);
  });

  it('rejects a Secondary action alone', () => {
    const validate = getPrimaryFirstValidator();

    expect(validate([{ variant: CTA_ACTION_VARIANT.SECONDARY }])).toBe(
      'A Primary action is required and must be first.',
    );
  });

  it('rejects two Primary actions', () => {
    const validate = getPrimaryFirstValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
      ]),
    ).toBe('Each action variant (Primary, Secondary) can be used only once.');
  });

  it('rejects Secondary before Primary', () => {
    const validate = getPrimaryFirstValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.SECONDARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
      ]),
    ).toBe('A Primary action is required and must be first.');
  });

  it('rejects three actions', () => {
    const validate = getPrimaryFirstValidator();

    expect(
      validate([
        { variant: CTA_ACTION_VARIANT.PRIMARY },
        { variant: CTA_ACTION_VARIANT.SECONDARY },
        { variant: CTA_ACTION_VARIANT.PRIMARY },
      ]),
    ).toBe('Each action variant (Primary, Secondary) can be used only once.');
  });

  it('caps the array at 2 and guards against a duplicate shared link', () => {
    const validators = getRecordedValidators<TCustomFn>(getActionsField());

    expect(validators).toHaveLength(2);
  });
});

describe('actionGroupSchema preview', () => {
  const { prepare } = actionGroupSchema.preview as {
    prepare: (props: {
      a0Override?: string;
      a0Link?: string;
      a1Override?: string;
      a1Link?: string;
    }) => { title: string; subtitle: string };
  };

  it('shows "No actions" with an empty group', () => {
    expect(prepare({})).toEqual({ title: 'No actions', subtitle: '0 actions' });
  });

  it("prefers each action's labelOverride over its shared link's label", () => {
    expect(
      prepare({
        a0Override: 'Read more',
        a0Link: "Read the post's actual label",
        a1Link: 'Contact us',
      }),
    ).toEqual({ title: 'Read more  ·  Contact us', subtitle: '2 actions' });
  });
});
