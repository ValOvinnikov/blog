import siteMessages from '@blog/config/voice/site-messages.en.json';
import { newsletterSettingsSchema } from '@blog/studio/schema-types/documents/settings/newsletter';

type TFieldDefinition = {
  name: string;
  type: string;
  fieldset?: string;
  initialValue?: unknown;
  validation?: unknown;
  fields?: readonly TFieldDefinition[];
};

type TValidationRule = {
  required: () => TValidationRule;
  max: (n: number) => TValidationRule;
};

const getField = (name: string): TFieldDefinition | undefined =>
  (
    newsletterSettingsSchema.fields as readonly TFieldDefinition[] | undefined
  )?.find((field) => field.name === name);

const getNestedField = (
  parentName: string,
  childName: string,
): TFieldDefinition | undefined =>
  getField(parentName)?.fields?.find((field) => field.name === childName);

const getRequiredAndMax = (
  field: TFieldDefinition | undefined,
): { required: boolean; max: number | undefined } => {
  if (!field?.validation) {
    throw new Error(`Expected field "${field?.name}" to define validation.`);
  }

  let required = false;
  let max: number | undefined;

  const rule: TValidationRule = {
    required: () => {
      required = true;
      return rule;
    },
    max: (n: number) => {
      max = n;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return { required, max };
};

describe('newsletterSettingsSchema formCopy fieldset', () => {
  const FORM_COPY_STRING_FIELDS = [
    { name: 'submitLabel', expected: siteMessages.newsletterForm.submitLabel },
    {
      name: 'emailPlaceholder',
      expected: siteMessages.newsletterForm.placeholder,
    },
    {
      name: 'successMessage',
      expected: siteMessages.newsletterForm.successMessage,
    },
    {
      name: 'errorInvalid',
      expected: siteMessages.newsletterForm.errorInvalid,
    },
    {
      name: 'errorAlreadySubscribed',
      expected: siteMessages.newsletterForm.errorAlreadySubscribed,
    },
    { name: 'errorServer', expected: siteMessages.newsletterForm.errorServer },
  ];

  it.each(FORM_COPY_STRING_FIELDS)(
    '$name is required, lives in the formCopy fieldset, and defaults to the catalog string',
    ({ name, expected }) => {
      const field = getField(name);

      expect(field?.fieldset).toBe('formCopy');
      expect(field?.initialValue).toBe(expected);
      expect(getRequiredAndMax(field).required).toBe(true);
    },
  );

  it('trustCues is a required string array capped at 2, defaulting to the catalog trust cues', () => {
    const field = getField('trustCues');

    expect(field?.type).toBe('array');
    expect(field?.fieldset).toBe('formCopy');
    expect(field?.initialValue).toEqual([
      siteMessages.newsletterForm.trustCueNoSpam,
      siteMessages.newsletterForm.trustCueUnsubscribe,
    ]);

    const { required, max } = getRequiredAndMax(field);

    expect(required).toBe(true);
    expect(max).toBe(2);
  });
});

describe('newsletterSettingsSchema landingPages fieldset', () => {
  it('confirm and unsubscribe objects live in the landingPages fieldset', () => {
    expect(getField('confirm')?.fieldset).toBe('landingPages');
    expect(getField('unsubscribe')?.fieldset).toBe('landingPages');
  });

  const CONFIRM_FIELDS = [
    {
      name: 'confirmedTitle',
      expected: siteMessages.newsletterConfirm.confirmedTitle,
    },
    {
      name: 'confirmedMessage',
      expected: siteMessages.newsletterConfirm.confirmedMessage,
    },
    {
      name: 'invalidTitle',
      expected: siteMessages.newsletterConfirm.invalidTitle,
    },
    {
      name: 'invalidMessage',
      expected: siteMessages.newsletterConfirm.invalidMessage,
    },
    { name: 'errorTitle', expected: siteMessages.newsletterConfirm.errorTitle },
    {
      name: 'errorMessage',
      expected: siteMessages.newsletterConfirm.errorMessage,
    },
    { name: 'returnHome', expected: siteMessages.newsletterConfirm.returnHome },
  ];

  it.each(CONFIRM_FIELDS)(
    'confirm.$name is required and defaults to the catalog string',
    ({ name, expected }) => {
      const field = getNestedField('confirm', name);

      expect(field?.initialValue).toBe(expected);
      expect(getRequiredAndMax(field).required).toBe(true);
    },
  );

  const UNSUBSCRIBE_FIELDS = [
    {
      name: 'confirmTitle',
      expected: siteMessages.newsletterUnsubscribe.confirmTitle,
    },
    {
      name: 'confirmMessage',
      expected: siteMessages.newsletterUnsubscribe.confirmMessage,
    },
    {
      name: 'confirmButtonLabel',
      expected: siteMessages.newsletterUnsubscribe.confirmButtonLabel,
    },
    {
      name: 'successTitle',
      expected: siteMessages.newsletterUnsubscribe.successTitle,
    },
    {
      name: 'successMessage',
      expected: siteMessages.newsletterUnsubscribe.successMessage,
    },
    {
      name: 'invalidTitle',
      expected: siteMessages.newsletterUnsubscribe.invalidTitle,
    },
    {
      name: 'invalidMessage',
      expected: siteMessages.newsletterUnsubscribe.invalidMessage,
    },
    {
      name: 'returnHome',
      expected: siteMessages.newsletterUnsubscribe.returnHome,
    },
  ];

  it.each(UNSUBSCRIBE_FIELDS)(
    'unsubscribe.$name is required and defaults to the catalog string',
    ({ name, expected }) => {
      const field = getNestedField('unsubscribe', name);

      expect(field?.initialValue).toBe(expected);
      expect(getRequiredAndMax(field).required).toBe(true);
    },
  );
});
