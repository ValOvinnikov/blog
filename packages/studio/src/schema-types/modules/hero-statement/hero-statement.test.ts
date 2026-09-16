import { CTA_ACTION_VARIANT, HERO_VARIANT } from '@blog/config/constants';
import { ctaButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { heroStatementSchema } from './hero-statement';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

const getField = (name: string) => {
  const field = heroStatementSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(
      `Expected heroStatementSchema to define a "${name}" field.`,
    );
  }

  return field;
};

const getFieldCustomValidator = (field: { validation?: unknown }): TCustomFn =>
  getCustomValidator<TCustomFn>(field);

describe('heroStatementSchema field order', () => {
  it('places title, brandVariant, headingBlock, eyebrow, ctaButtons before the shared hero tail', () => {
    const names = heroStatementSchema.fields
      ?.map((field) => ('name' in field ? field.name : undefined))
      .slice(0, 5);

    expect(names).toEqual([
      'title',
      'brandVariant',
      'headingBlock',
      'eyebrow',
      'ctaButtons',
    ]);
  });
});

describe('heroStatementSchema brandVariant field', () => {
  it('is required, matching what the service reads as non-null', () => {
    const field = getField('brandVariant');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected brandVariant field to define validation.');
    }

    let requiredCalled = false;
    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

describe('heroStatementSchema eyebrow field', () => {
  it('is optional with no length cap', () => {
    const field = getField('eyebrow');

    expect(field.validation).toBeUndefined();
  });
});

describe('heroStatementSchema headingBlock field', () => {
  it('uses the shared headingBlock object type', () => {
    const field = getField('headingBlock') as { type: string };

    expect(field.type).toBe('headingBlock');
  });

  it('is required at the field level', () => {
    const field = getField('headingBlock');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected headingBlock field to define validation.');
    }

    let requiredCalled = false;
    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

describe('heroStatementSchema hero tail', () => {
  it('offers every hero variant, defaulting to Split', () => {
    const field = getField('variant') as {
      options?: { list?: { value: string }[] };
      initialValue?: string;
    };

    expect(field.options?.list?.map((option) => option.value)).toEqual(
      Object.values(HERO_VARIANT),
    );
    expect(field.initialValue).toBe(HERO_VARIANT.SPLIT);
  });

  it('requires an image only for Split and Banner', () => {
    const validate = getFieldCustomValidator(getField('image'));

    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.SPLIT } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.BANNER } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.STACKED } }),
    ).toBe(true);
  });

  it('image field uses the shared imageWithAlt object', () => {
    const field = getField('image') as { type: string };

    expect(field.type).toBe(imageWithAltSchema.name);
  });

  it('authors its buttons through the shared ctaButtons field', () => {
    const field = getField('ctaButtons') as {
      type: string;
      of?: { type: string }[];
    };

    expect(field.type).toBe('array');
    expect(field.of?.[0]?.type).toBe(ctaButtonSchema.name);
  });

  it('allows both a primary and a secondary button', () => {
    const validate = getFieldCustomValidator(getField('ctaButtons'));

    expect(
      validate(
        [
          { variant: CTA_ACTION_VARIANT.PRIMARY },
          { variant: CTA_ACTION_VARIANT.SECONDARY },
        ],
        { parent: {} },
      ),
    ).toBe(true);
  });
});

describe('heroStatementSchema preview', () => {
  it('selects subtitle from headingBlock.heading', () => {
    expect(heroStatementSchema.preview?.select).toEqual({
      title: 'title',
      subtitle: 'headingBlock.heading',
    });
  });

  it('falls back to Unknown / No heading yet when empty', () => {
    const prepare = heroStatementSchema.preview?.prepare;

    if (!prepare) {
      throw new Error(
        'Expected heroStatementSchema to define preview.prepare.',
      );
    }

    expect(prepare({ title: undefined, subtitle: undefined })).toEqual({
      title: 'Unknown',
      subtitle: 'No heading yet',
    });
  });

  it('shows the title and heading when present', () => {
    const prepare = heroStatementSchema.preview?.prepare;

    if (!prepare) {
      throw new Error(
        'Expected heroStatementSchema to define preview.prepare.',
      );
    }

    expect(
      prepare({ title: 'Home Statement Hero', subtitle: 'We build things.' }),
    ).toEqual({
      title: 'Home Statement Hero',
      subtitle: 'We build things.',
    });
  });
});
