import { CTA_ACTION_VARIANT } from '@blog/config/constants';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

type TCustomFn = (value: unknown) => string | true;

const getValidator = (field: ReturnType<typeof ctaButtonsField>): TCustomFn =>
  getCustomValidator<TCustomFn>(field);

describe(ctaButtonsField, () => {
  it('names the field ctaButtons', () => {
    expect(ctaButtonsField().name).toBe('ctaButtons');
  });

  it('defaults min to 0 and max to 2', () => {
    const field = ctaButtonsField();
    let minArg: number | undefined;
    let maxArg: number | undefined;

    const rule = {
      min: (n: number) => {
        minArg = n;
        return rule;
      },
      max: (n: number) => {
        maxArg = n;
        return rule;
      },
      custom: () => rule,
    };

    if (!field.validation) {
      throw new Error('Expected ctaButtonsField to define validation.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(minArg).toBe(0);
    expect(maxArg).toBe(2);
  });

  it('lets a consumer override min and max', () => {
    const field = ctaButtonsField({ min: 1, max: 4 });
    let minArg: number | undefined;
    let maxArg: number | undefined;

    const rule = {
      min: (n: number) => {
        minArg = n;
        return rule;
      },
      max: (n: number) => {
        maxArg = n;
        return rule;
      },
      custom: () => rule,
    };

    if (!field.validation) {
      throw new Error('Expected ctaButtonsField to define validation.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(minArg).toBe(1);
    expect(maxArg).toBe(4);
  });

  describe('primary ordering', () => {
    it('is valid with an empty array', () => {
      const validate = getValidator(ctaButtonsField());

      expect(validate(undefined)).toBe(true);
      expect(validate([])).toBe(true);
    });

    it('is valid with a Secondary action alone', () => {
      const validate = getValidator(ctaButtonsField());

      expect(validate([{ variant: CTA_ACTION_VARIANT.SECONDARY }])).toBe(true);
    });

    it('is valid with Primary followed by Secondary', () => {
      const validate = getValidator(ctaButtonsField());

      expect(
        validate([
          { variant: CTA_ACTION_VARIANT.PRIMARY },
          { variant: CTA_ACTION_VARIANT.SECONDARY },
        ]),
      ).toBe(true);
    });

    it('rejects Secondary before Primary', () => {
      const validate = getValidator(ctaButtonsField());

      expect(
        validate([
          { variant: CTA_ACTION_VARIANT.SECONDARY },
          { variant: CTA_ACTION_VARIANT.PRIMARY },
        ]),
      ).toBe('A Primary action must be listed first.');
    });

    it('rejects two Primary actions', () => {
      const validate = getValidator(ctaButtonsField());

      expect(
        validate([
          { variant: CTA_ACTION_VARIANT.PRIMARY },
          { variant: CTA_ACTION_VARIANT.PRIMARY },
        ]),
      ).toBe('Only one Primary action is allowed.');
    });

    it('rejects two Secondary actions', () => {
      const validate = getValidator(ctaButtonsField());

      expect(
        validate([
          { variant: CTA_ACTION_VARIANT.SECONDARY },
          { variant: CTA_ACTION_VARIANT.SECONDARY },
        ]),
      ).toBe('Only one Secondary action is allowed.');
    });
  });
});
