import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';

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

const getBaselineField = () => {
  const [field] = alignmentFields([]);

  if (!field) {
    throw new Error('Expected alignmentFields([]) to return a field.');
  }

  return field;
};

describe('alignmentFields with no extras', () => {
  it('returns exactly one field: the contentAlignment baseline', () => {
    const fields = alignmentFields([]);

    expect(fields.map((field) => field.name)).toEqual(['contentAlignment']);
  });

  it('offers Left, Center and Right', () => {
    expect(getOptionValues(getBaselineField())).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('describes itself in terms true of any caller, not CTA specifically', () => {
    const field = getBaselineField();

    expect(field.description).toBe(
      "Horizontal alignment of this module's content.",
    );
    expect(field.description).not.toMatch(/actions/i);
  });

  it('renders as a dropdown: it is optional with no required() constraint', () => {
    const field = getBaselineField();

    expect(field.options?.layout).toBe('dropdown');
  });
});

describe('alignmentFields with a variant-scoped extra', () => {
  const getExtraField = () => {
    const [field] = alignmentFields([
      {
        name: 'contentPositionSplit',
        title: 'Content Position',
        description: 'Where the content sits relative to the image.',
        allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: () => false,
      },
    ]);

    if (!field) {
      throw new Error('Expected an extra field to be returned first.');
    }

    return field;
  };

  it('also renders as a dropdown: an initialValue does not by itself require radio', () => {
    expect(getExtraField().options?.layout).toBe('dropdown');
  });

  it('restricts its options to the allowed subset', () => {
    expect(getOptionValues(getExtraField())).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });
});
