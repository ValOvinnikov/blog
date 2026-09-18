import { FEATURE_ICONS } from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { headingBlockSchema } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getCustomValidatorWithLevel } from '@blog/studio/testing/create-mock-validation-rule';
import { getFieldOptionValues } from '@blog/studio/testing/get-field-options';
import { getSchemaField } from '@blog/studio/testing/get-schema-field';
import type { SanityDocument } from 'sanity';

const getField = (name: string) => getSchemaField(featureBlockSchema, name);

type TDocFn = (document: SanityDocument | undefined) => string | true;

describe('featureBlockSchema title field', () => {
  it('is required', () => {
    const field = getField('title');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected title field to define validation.');
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

describe('featureBlockSchema headingBlock field', () => {
  it('is a required headingBlock field', () => {
    const field = getField('headingBlock');

    expect(field.type).toBe(headingBlockSchema.name);

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

describe('featureBlockSchema icon field', () => {
  it('offers every FEATURE_ICONS value, and stays optional', () => {
    const field = getField('icon');

    expect(getFieldOptionValues(field)).toEqual([...FEATURE_ICONS]);
    expect(field.validation).toBeUndefined();
  });
});

describe('featureBlockSchema image field', () => {
  it('is an imageWithAlt field, and stays optional', () => {
    const field = getField('image');

    expect(field.type).toBe(imageWithAltSchema.name);
    expect(field.validation).toBeUndefined();
  });
});

describe('featureBlockSchema link field', () => {
  it('references only the link document, and stays optional', () => {
    const field = getField('link') as {
      type: string;
      to?: { type: string }[];
      validation?: unknown;
    };

    expect(field.type).toBe('reference');
    expect(field.to).toEqual([{ type: linkSchema.name }]);
    expect(field.validation).toBeUndefined();
  });
});

describe('featureBlockSchema document validation', () => {
  const getVisualValidator = () =>
    getCustomValidatorWithLevel<TDocFn>(featureBlockSchema);

  it('registers the visual check at error severity, not warning', () => {
    const { isWarning } = getVisualValidator();

    expect(isWarning).toBe(false);
  });

  it('fails when the card has neither an icon nor an image', () => {
    const { fn: validate } = getVisualValidator();

    expect(
      validate({
        icon: undefined,
        image: undefined,
      } as unknown as SanityDocument),
    ).toBe('Add an icon or an image so this card has something to display.');
  });

  it('passes when the card has only an icon', () => {
    const { fn: validate } = getVisualValidator();

    expect(
      validate({ icon: 'CODE', image: undefined } as unknown as SanityDocument),
    ).toBe(true);
  });

  it('passes when the card has only an image', () => {
    const { fn: validate } = getVisualValidator();

    expect(
      validate({
        icon: undefined,
        image: { asset: {} },
      } as unknown as SanityDocument),
    ).toBe(true);
  });

  it('passes when the card has both an icon and an image', () => {
    const { fn: validate } = getVisualValidator();

    expect(
      validate({
        icon: 'CODE',
        image: { asset: {} },
      } as unknown as SanityDocument),
    ).toBe(true);
  });
});

describe('featureBlockSchema preview', () => {
  const prepare = featureBlockSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected featureBlockSchema to define preview.prepare.');
  }

  it('shows the link label as the subtitle when a link is set', () => {
    expect(
      prepare({
        title: 'Fast Builds',
        linkLabel: 'Learn more',
        image: undefined,
        icon: undefined,
      }),
    ).toEqual({
      title: 'Fast Builds',
      subtitle: 'Learn more',
      media: undefined,
    });
  });

  it('falls back to "No link" when no link is set', () => {
    expect(
      prepare({
        title: 'Fast Builds',
        linkLabel: undefined,
        image: undefined,
        icon: undefined,
      }),
    ).toEqual({
      title: 'Fast Builds',
      subtitle: 'No link',
      media: undefined,
    });
  });

  it('falls back to "Unknown" when there is no title', () => {
    expect(
      prepare({
        title: undefined,
        linkLabel: undefined,
        image: undefined,
        icon: undefined,
      }),
    ).toEqual({
      title: 'Unknown',
      subtitle: 'No link',
      media: undefined,
    });
  });

  it('uses the image as media when one is set', () => {
    const image = { asset: { _ref: 'image-abc' } };

    expect(
      prepare({
        title: 'Fast Builds',
        linkLabel: undefined,
        image,
        icon: 'CODE',
      }),
    ).toEqual({
      title: 'Fast Builds',
      subtitle: 'No link',
      media: image,
    });
  });

  it('falls back to a rendered icon as media when there is no image', () => {
    const result = prepare({
      title: 'Fast Builds',
      linkLabel: undefined,
      image: undefined,
      icon: 'CODE',
    });

    expect(result.media).toBeDefined();
  });

  it('has no media when neither an image nor an icon is set', () => {
    expect(
      prepare({
        title: 'Fast Builds',
        linkLabel: undefined,
        image: undefined,
        icon: undefined,
      }).media,
    ).toBeUndefined();
  });
});
