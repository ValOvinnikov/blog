import { FEATURE_ICONS } from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';

const getField = (name: string) => {
  const field = featureBlockSchema.fields.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected featureBlockSchema to define a "${name}" field.`);
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

    expect(getOptionValues(field)).toEqual([...FEATURE_ICONS]);
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
