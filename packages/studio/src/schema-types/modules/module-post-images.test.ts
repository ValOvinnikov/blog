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

    it('requires a value', () => {
      const field = getField(schema, 'showImages');

      if (!field || !('validation' in field) || !field.validation) {
        throw new Error('Expected showImages field to define validation.');
      }

      const rule = { required: () => 'required-rule' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
      const result = (field.validation as any)(rule);

      expect(result).toBe('required-rule');
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
