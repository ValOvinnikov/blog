import { schemaTypes } from '@blog/studio/schema-types';

describe('schemaTypes', () => {
  it('gives every registered schema type a non-empty description', () => {
    const undescribed = schemaTypes.filter(
      (schema) =>
        typeof schema.description !== 'string' || !schema.description.trim(),
    );

    expect(undescribed.map((schema) => schema.name)).toEqual([]);
  });
});
