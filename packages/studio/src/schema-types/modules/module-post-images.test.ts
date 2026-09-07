import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';

type TModuleSchema = {
  fields?: readonly { name: string }[];
};

const modulesWithShowImages: readonly [string, TModuleSchema][] = [
  ['module_postLatest', postLatestSchema],
  ['module_postList', postListSchema],
];

const getField = (schema: TModuleSchema, name: string) =>
  schema.fields?.find((field) => field.name === name);

describe.each(modulesWithShowImages)(
  '%s showImages field',
  (_typeName, schema) => {
    it('exposes a showImages field', () => {
      expect(getField(schema, 'showImages')).toBeDefined();
    });

    it('is a boolean field defaulting to true', () => {
      const field = getField(schema, 'showImages');

      if (!field) {
        throw new Error('Expected a showImages field.');
      }

      expect(field).toMatchObject({ type: 'boolean', initialValue: true });
    });

    it('defines no validation rule', () => {
      const field = getField(schema, 'showImages');

      if (!field) {
        throw new Error('Expected a showImages field.');
      }

      expect(
        'validation' in field ? field.validation : undefined,
      ).toBeUndefined();
    });

    it('is emitted immediately after sectionHeader', () => {
      const names = schema.fields?.map((field) => field.name) ?? [];
      const sectionHeaderIndex = names.indexOf('sectionHeader');
      const showImagesIndex = names.indexOf('showImages');

      expect(sectionHeaderIndex).toBeGreaterThanOrEqual(0);
      expect(showImagesIndex).toBe(sectionHeaderIndex + 1);
    });
  },
);
