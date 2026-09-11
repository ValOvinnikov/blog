import { HERO_VARIANT } from '@blog/config/constants';
import { actionGroupSchema } from '@blog/studio/schema-types/objects/blocks/action-group';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt';

import { heroStatementSchema } from './module-hero-statement';

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

const getFieldCustomValidator = (field: {
  validation?: unknown;
}): TCustomFn => {
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

describe('heroStatementSchema field order', () => {
  it('places title, eyebrow, heading, supportingText before the shared hero tail', () => {
    const names = heroStatementSchema.fields
      ?.map((field) => ('name' in field ? field.name : undefined))
      .slice(0, 4);

    expect(names).toEqual(['title', 'eyebrow', 'heading', 'supportingText']);
  });
});

describe('heroStatementSchema eyebrow field', () => {
  it('caps at 40 characters and is optional', () => {
    const field = getField('eyebrow');
    const rule = { max: (n: number) => `max:${n}` };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    expect((field.validation as any)(rule)).toBe('max:40');
  });
});

describe('heroStatementSchema heading field', () => {
  it('is required with a custom message, and separately capped at 120', () => {
    const field = getField('heading');
    const rule = {
      required: () => ({
        error: (message: string) => `required-error:${message}`,
      }),
      max: (n: number) => `max:${n}`,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    expect((field.validation as any)(rule)).toEqual([
      'required-error:A statement hero is its heading. Give it one.',
      'max:120',
    ]);
  });
});

describe('heroStatementSchema supportingText field', () => {
  it('is a plain, optional text field', () => {
    const field = getField('supportingText') as { type: string; rows?: number };

    expect(field.type).toBe('text');
    expect(field.rows).toBe(3);
    expect('validation' in field).toBe(false);
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

  it('renders actions through the shared actionGroup object', () => {
    const field = getField('actions') as { type: string };

    expect(field.type).toBe(actionGroupSchema.name);
  });
});

describe('heroStatementSchema preview', () => {
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
