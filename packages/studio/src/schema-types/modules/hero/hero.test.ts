import { CTA_ACTION_VARIANT } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroSchema } from '@blog/studio/schema-types/modules/hero/hero';
import { getRecordedValidators } from '@blog/studio/testing/create-mock-validation-rule';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

const getField = (name: string) => {
  const field = heroSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected heroSchema to define a "${name}" field.`);
  }

  return field;
};

describe('heroSchema featuredPost field', () => {
  it('only accepts page_post references', () => {
    const field = getField('featuredPost') as { to?: { type: string }[] };

    expect(field.to).toEqual([{ type: PAGE_POST_TYPE }]);
  });
});

describe('heroSchema actions field', () => {
  const getVariantGuard = (): TCustomFn => {
    const validators = getRecordedValidators<TCustomFn>(getField('actions'));
    const variantGuard = validators.at(-1);

    if (!variantGuard) {
      throw new Error(
        'Expected actions to register a Secondary-variant guard.',
      );
    }

    return variantGuard.fn;
  };

  it('is capped at 1 and offers only ctaActionRef members', () => {
    const field = getField('actions') as { of?: { type: string }[] };

    expect(field.of).toEqual([{ type: 'ctaActionRef' }]);
  });

  it('is valid when unset or empty', () => {
    const validate = getVariantGuard();

    expect(validate(undefined, { parent: {} })).toBe(true);
    expect(validate([], { parent: {} })).toBe(true);
  });

  it('is valid with the Secondary variant', () => {
    const validate = getVariantGuard();

    expect(
      validate([{ variant: CTA_ACTION_VARIANT.SECONDARY }], { parent: {} }),
    ).toBe(true);
  });

  it('errors with the Primary variant', () => {
    const validate = getVariantGuard();

    expect(
      validate([{ variant: CTA_ACTION_VARIANT.PRIMARY }], { parent: {} }),
    ).toBe('Actions must use the Secondary variant.');
  });

  it('has no bespoke secondaryAction field', () => {
    expect(
      heroSchema.fields?.find(
        (field) => 'name' in field && field.name === 'secondaryAction',
      ),
    ).toBeUndefined();
  });
});
