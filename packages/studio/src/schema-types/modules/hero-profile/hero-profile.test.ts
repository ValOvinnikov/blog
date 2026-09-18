import { getField } from '@blog/studio/testing/get-field';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

import { heroProfileSchema } from './hero-profile';

const getHeroProfileField = (name: string) => getField(heroProfileSchema, name);

describe('heroProfileSchema field order', () => {
  it('places title, brandVariant, headingBlock, eyebrow, author, image, ctaButtons, showSocialLinks before the shared hero tail', () => {
    const names = heroProfileSchema.fields
      ?.map((field) => ('name' in field ? field.name : undefined))
      .slice(0, 8);

    expect(names).toEqual([
      'title',
      'brandVariant',
      'headingBlock',
      'eyebrow',
      'author',
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

describe('heroProfileSchema hero tail', () => {
  it('has exactly one image field', () => {
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
