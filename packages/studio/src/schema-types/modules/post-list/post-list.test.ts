import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';

const getField = (name: string) => {
  const field = postListSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected postListSchema to define a "${name}" field.`);
  }

  return field;
};

describe('postListSchema contentAlignment field', () => {
  it('includes a contentAlignment field', () => {
    expect(getField('contentAlignment')).toBeDefined();
  });
});

describe('postListSchema showImages field', () => {
  it('includes a showImages field', () => {
    expect(getField('showImages')).toBeDefined();
  });
});
