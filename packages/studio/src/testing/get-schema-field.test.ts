import { getSchemaField } from '@blog/studio/testing/get-schema-field';
import { defineField, defineType } from 'sanity';

const fixtureSchema = defineType({
  name: 'testing_fixture',
  title: 'Testing Fixture',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'count', title: 'Count', type: 'number' }),
  ],
});

describe(getSchemaField, () => {
  it('returns the field matching the given name', () => {
    expect(getSchemaField(fixtureSchema, 'count').type).toBe('number');
  });

  it('works against any schema passed in, not just one closed over', () => {
    const otherSchema = defineType({
      name: 'testing_other',
      title: 'Testing Other',
      type: 'document',
      fields: [defineField({ name: 'label', title: 'Label', type: 'string' })],
    });

    expect(getSchemaField(otherSchema, 'label').type).toBe('string');
  });

  it('throws, naming the schema and field, when no field matches', () => {
    expect(() => getSchemaField(fixtureSchema, 'missing')).toThrow(
      /testing_fixture.*"missing"/,
    );
  });

  it('throws when the schema defines no fields at all', () => {
    const noFieldsSchema = defineType({
      name: 'testing_no_fields',
      title: 'Testing No Fields',
      type: 'document',
      fields: [],
    });

    expect(() => getSchemaField(noFieldsSchema, 'title')).toThrow(/title/);
  });
});
