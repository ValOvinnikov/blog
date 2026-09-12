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
});
