import { IMAGE_LAYOUT } from '@blog/config/constants';
import { bodyImageSchema } from '@blog/studio/schema-types/objects/body-image/body-image';

const getLayoutField = () => {
  const field = bodyImageSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === 'layout',
  );

  if (!field) {
    throw new Error('Expected bodyImageSchema to define a "layout" field.');
  }

  return field;
};

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
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

describe('bodyImageSchema layout field', () => {
  it('renders as a dropdown: it is optional with no required() constraint', () => {
    expect(getLayout(getLayoutField())).toBe('dropdown');
  });

  it('offers every IMAGE_LAYOUT value', () => {
    expect(getOptionValues(getLayoutField())).toEqual(
      Object.values(IMAGE_LAYOUT),
    );
  });

  it('has no required() validation, matching its "leave unset" description', () => {
    expect(getLayoutField().validation).toBeUndefined();
  });
});
