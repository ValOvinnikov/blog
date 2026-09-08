import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';

const getField = (name: string) => {
  const field = newsletterSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected newsletterSchema to define a "${name}" field.`);
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

describe('newsletterSchema variant field', () => {
  it('offers Full and Compact, defaulting to Full', () => {
    const field = getField('variant');

    expect(getOptionValues(field)).toEqual([
      NEWSLETTER_VARIANT.FULL,
      NEWSLETTER_VARIANT.COMPACT,
    ]);
    expect(field.initialValue).toBe(NEWSLETTER_VARIANT.FULL);
  });

  it('is optional — no validation() builder attached', () => {
    expect(getField('variant').validation).toBeUndefined();
  });
});
