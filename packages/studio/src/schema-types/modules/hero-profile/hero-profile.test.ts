import { PROFILE_IMAGE_SOURCE } from '@blog/config/constants';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { heroProfileSchema } from './hero-profile';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (name: string) => {
  const field = heroProfileSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected heroProfileSchema to define a "${name}" field.`);
  }

  return field;
};

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getFieldset = (field: { fieldset?: unknown }) =>
  field.fieldset as string | undefined;

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
    error: () => rule,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};

const getFieldCustomValidator = (field: { validation?: unknown }): TCustomFn =>
  getCustomValidator<TCustomFn>(field);

describe('heroProfileSchema field order', () => {
  it('places title, brandVariant, headingBlock, eyebrow, author, imageSource, image, ctaButtons, showSocialLinks before the shared hero tail', () => {
    const names = heroProfileSchema.fields
      ?.map((field) => ('name' in field ? field.name : undefined))
      .slice(0, 9);

    expect(names).toEqual([
      'title',
      'brandVariant',
      'headingBlock',
      'eyebrow',
      'author',
      'imageSource',
      'image',
      'ctaButtons',
      'showSocialLinks',
    ]);
  });
});

describe('heroProfileSchema required fields', () => {
  it('requires headingBlock and author', () => {
    expect(wasRequiredCalled(getField('headingBlock'))).toBe(true);
    expect(wasRequiredCalled(getField('author'))).toBe(true);
  });
});

describe('heroProfileSchema imageSource field', () => {
  it('is a required radio in the image fieldset, and drives the image field — required because it gates a hidden: predicate', () => {
    const field = getField('imageSource');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('image');
  });
});

describe('heroProfileSchema image field', () => {
  it('is hidden unless Source is Custom', () => {
    const hidden = getHidden(getField('image'));

    expect(
      hidden({ parent: { imageSource: PROFILE_IMAGE_SOURCE.CUSTOM } }),
    ).toBe(false);
    expect(
      hidden({ parent: { imageSource: PROFILE_IMAGE_SOURCE.AUTHOR } }),
    ).toBe(true);
    expect(hidden({ parent: { imageSource: PROFILE_IMAGE_SOURCE.NONE } })).toBe(
      true,
    );
  });

  it('errors when Custom with no image chosen', () => {
    const validate = getFieldCustomValidator(getField('image'));

    expect(
      validate(undefined, {
        parent: { imageSource: PROFILE_IMAGE_SOURCE.CUSTOM },
      }),
    ).toBe('A custom image is required when Source is Custom.');
  });

  it('is valid with no image when Source is Author or None', () => {
    const validate = getFieldCustomValidator(getField('image'));

    expect(
      validate(undefined, {
        parent: { imageSource: PROFILE_IMAGE_SOURCE.AUTHOR },
      }),
    ).toBe(true);
    expect(
      validate(undefined, {
        parent: { imageSource: PROFILE_IMAGE_SOURCE.NONE },
      }),
    ).toBe(true);
  });
});

describe('heroProfileSchema hero tail', () => {
  it('has exactly one image field, the custom-image trio above', () => {
    const imageFields = heroProfileSchema.fields?.filter(
      (field) => 'name' in field && field.name === 'image',
    );

    expect(imageFields).toHaveLength(1);
  });

  it('has mediaOrderSplit but no mediaOrderStacked', () => {
    expect(
      heroProfileSchema.fields?.some(
        (field) => 'name' in field && field.name === 'mediaOrderSplit',
      ),
    ).toBe(true);
    expect(
      heroProfileSchema.fields?.some(
        (field) => 'name' in field && field.name === 'mediaOrderStacked',
      ),
    ).toBe(false);
  });
});

describe('heroProfileSchema preview', () => {
  it('selects subtitle from headingBlock.heading', () => {
    expect(heroProfileSchema.preview?.select).toEqual({
      title: 'title',
      subtitle: 'headingBlock.heading',
    });
  });

  it('falls back to Unknown / No heading yet when empty', () => {
    const prepare = heroProfileSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected heroProfileSchema to define preview.prepare.');
    }

    expect(prepare({ title: undefined, subtitle: undefined })).toEqual({
      title: 'Unknown',
      subtitle: 'No heading yet',
    });
  });

  it('shows the title and heading when present', () => {
    const prepare = heroProfileSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected heroProfileSchema to define preview.prepare.');
    }

    expect(
      prepare({ title: 'Home Profile Hero', subtitle: 'Meet Jane.' }),
    ).toEqual({
      title: 'Home Profile Hero',
      subtitle: 'Meet Jane.',
    });
  });
});
