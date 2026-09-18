import { PROFILE_IMAGE_SOURCE } from '@blog/config/constants';
import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
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

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
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

describe('heroProfileSchema fieldsets', () => {
  it('declares image and the shared content position fieldset', () => {
    const names = heroProfileSchema.fieldsets?.map((fieldset) => fieldset.name);

    expect(names).toEqual(['image', 'contentPosition']);
  });
});

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

describe('heroProfileSchema headingBlock field', () => {
  it('uses the shared headingBlock object type and is required', () => {
    const field = getField('headingBlock') as { type: string };

    expect(field.type).toBe('headingBlock');
    expect(wasRequiredCalled(getField('headingBlock'))).toBe(true);
  });
});

describe('heroProfileSchema eyebrow field', () => {
  it('is optional', () => {
    expect(getField('eyebrow').validation).toBeUndefined();
  });
});

describe('heroProfileSchema author field', () => {
  it('only accepts blog_author references', () => {
    const field = getField('author') as { to?: { type: string }[] };

    expect(field.to).toEqual([{ type: authorSchema.name }]);
  });

  it('is required', () => {
    expect(wasRequiredCalled(getField('author'))).toBe(true);
  });
});

describe('heroProfileSchema imageSource field', () => {
  it('offers Author, Custom and None, defaulting to Author', () => {
    const field = getField('imageSource');

    expect(getOptionValues(field)).toEqual([
      PROFILE_IMAGE_SOURCE.AUTHOR,
      PROFILE_IMAGE_SOURCE.CUSTOM,
      PROFILE_IMAGE_SOURCE.NONE,
    ]);
    expect(field.initialValue).toBe(PROFILE_IMAGE_SOURCE.AUTHOR);
  });

  it('is a required radio in the image fieldset, and drives the image field — required because it gates a hidden: predicate', () => {
    const field = getField('imageSource');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('image');
  });
});

describe('heroProfileSchema image field', () => {
  it('is in the image fieldset, uses imageWithAlt, hidden unless Source is Custom', () => {
    const field = getField('image') as { type: string };
    const hidden = getHidden(getField('image'));

    expect(field.type).toBe(imageWithAltSchema.name);
    expect(getFieldset(getField('image'))).toBe('image');
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

describe('heroProfileSchema showSocialLinks field', () => {
  it('defaults to true and is optional', () => {
    const field = getField('showSocialLinks');

    expect(field.initialValue).toBe(true);
    expect(field.validation).toBeUndefined();
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
