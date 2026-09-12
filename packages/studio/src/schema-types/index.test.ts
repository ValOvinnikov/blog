import { schemaTypes } from '@blog/studio/schema-types';

type TFieldWithDescription = { name: string; description?: string };
type TSchemaWithFields = { name: string; fields?: TFieldWithDescription[] };

/**
 * `migrationState` is the migration tooling's own operational ledger — it is
 * kept out of Studio editing and search entirely, so its fields are never
 * seen by an editor and are exempt from the description requirement below.
 */
const NOT_EDITOR_FACING = new Set(['migrationState']);

describe('schemaTypes', () => {
  it('gives every registered schema type a non-empty description', () => {
    const undescribed = schemaTypes.filter(
      (schema) =>
        typeof schema.description !== 'string' || !schema.description.trim(),
    );

    expect(undescribed.map((schema) => schema.name)).toEqual([]);
  });

  it('gives every field on every editor-facing schema type a non-empty description', () => {
    const undescribed = schemaTypes
      .filter((schema) => !NOT_EDITOR_FACING.has(schema.name))
      .flatMap((schema) => {
        const { name, fields } = schema as TSchemaWithFields;

        return (fields ?? [])
          .filter(
            (field) =>
              typeof field.description !== 'string' ||
              !field.description.trim(),
          )
          .map((field) => `${name}.${field.name}`);
      });

    expect(undescribed).toEqual([]);
  });
});
