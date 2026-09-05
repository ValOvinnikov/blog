import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';

type TModuleSchema = {
  fields?: readonly { name: string; options?: unknown }[];
};

const modulesWithHeadingAlignment: readonly [string, TModuleSchema][] = [
  ['module_postList', postListSchema],
  ['module_postLatest', postLatestSchema],
  ['module_newsletter', newsletterSchema],
  ['module_taxonomyList', taxonomyListSchema],
];

const getField = (schema: TModuleSchema, name: string) =>
  schema.fields?.find((field) => field.name === name);

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

describe.each(modulesWithHeadingAlignment)(
  '%s contentAlignment field',
  (_typeName, schema) => {
    it('exposes a contentAlignment field', () => {
      expect(getField(schema, 'contentAlignment')).toBeDefined();
    });

    it('offers Left, Center and Right', () => {
      const field = getField(schema, 'contentAlignment');

      if (!field) {
        throw new Error('Expected a contentAlignment field.');
      }

      expect(getOptionValues(field)).toEqual([
        CONTENT_ALIGNMENT.LEFT,
        CONTENT_ALIGNMENT.CENTER,
        CONTENT_ALIGNMENT.RIGHT,
      ]);
    });

    it('does not carry a top-level align field', () => {
      expect(getField(schema, 'align')).toBeUndefined();
    });
  },
);
