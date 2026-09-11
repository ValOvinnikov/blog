import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroSchema } from '@blog/studio/schema-types/modules/module-hero';

const getField = (name: string) => {
  const field = heroSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected heroSchema to define a "${name}" field.`);
  }

  return field;
};

describe('heroSchema featuredPost field', () => {
  it('only accepts page_post references', () => {
    const field = getField('featuredPost') as { to?: { type: string }[] };

    expect(field.to).toEqual([{ type: PAGE_POST_TYPE }]);
  });
});
