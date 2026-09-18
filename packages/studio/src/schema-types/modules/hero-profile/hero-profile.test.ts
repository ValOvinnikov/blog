import { PROFILE_IMAGE_SOURCE } from '@blog/config/constants';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { getFieldset } from '@blog/studio/testing/get-field-fieldset';
import { getHidden } from '@blog/studio/testing/get-field-hidden';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

import { heroProfileSchema } from './hero-profile';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

const getHeroProfileField = (name: string) => getField(heroProfileSchema, name);

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
    expect(wasRequiredCalled(getHeroProfileField('headingBlock'))).toBe(true);
    expect(wasRequiredCalled(getHeroProfileField('author'))).toBe(true);
  });
});

describe('heroProfileSchema imageSource field', () => {
  it('is a required radio in the image fieldset, and drives the image field — required because it gates a hidden: predicate', () => {
    const field = getHeroProfileField('imageSource');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('image');
  });
});

describe('heroProfileSchema image field', () => {
  it('is hidden unless Source is Custom', () => {
    const hidden = getHidden(getHeroProfileField('image'));

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
    const validate = getCustomValidator<TCustomFn>(
      getHeroProfileField('image'),
    );

    expect(
      validate(undefined, {
        parent: { imageSource: PROFILE_IMAGE_SOURCE.CUSTOM },
      }),
    ).toBe('A custom image is required when Source is Custom.');
  });

  it('is valid with no image when Source is Author or None', () => {
    const validate = getCustomValidator<TCustomFn>(
      getHeroProfileField('image'),
    );

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
