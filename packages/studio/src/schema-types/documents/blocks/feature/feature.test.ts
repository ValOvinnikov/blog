import { FEATURE_ICONS } from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getFieldOptionValues } from '@blog/studio/testing/get-field-options';
import { getSchemaField } from '@blog/studio/testing/get-schema-field';

const getField = (name: string) => getSchemaField(featureBlockSchema, name);

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

describe('featureBlockSchema text field', () => {
  it('is a 3-row text field with no validation', () => {
    const field = getField('text') as { rows?: number; validation?: unknown };

    expect(field.rows).toBe(3);
    expect(field.validation).toBeUndefined();
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

describe('featureBlockSchema preview', () => {
  const prepare = featureBlockSchema.preview?.prepare;

  it('shows the link label as the subtitle when a link is set', () => {
    if (!prepare) {
      throw new Error('Expected featureBlockSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'Fast Builds',
        linkLabel: 'Learn more',
        media: undefined,
      }),
    ).toEqual({
      title: 'Fast Builds',
      subtitle: 'Learn more',
      media: undefined,
    });
  });

  it('falls back to "No link" when no link is set', () => {
    if (!prepare) {
      throw new Error('Expected featureBlockSchema to define preview.prepare.');
    }

    expect(
      prepare({ title: 'Fast Builds', linkLabel: undefined, media: undefined }),
    ).toEqual({
      title: 'Fast Builds',
      subtitle: 'No link',
      media: undefined,
    });
  });

  it('falls back to "Unknown" when there is no title', () => {
    if (!prepare) {
      throw new Error('Expected featureBlockSchema to define preview.prepare.');
    }

    expect(
      prepare({ title: undefined, linkLabel: undefined, media: undefined }),
    ).toEqual({
      title: 'Unknown',
      subtitle: 'No link',
      media: undefined,
    });
  });
});
