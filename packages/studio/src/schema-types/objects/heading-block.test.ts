import {
  headingBlockSchema,
  requiredHeadingBlockSchema,
} from '@blog/studio/schema-types/objects/heading-block';
import type { ObjectDefinition } from 'sanity';

const fieldNames = (schema: ObjectDefinition) =>
  schema.fields?.map((field) => field.name);

describe('headingBlockSchema shape', () => {
  it('carries only heading and supportingText', () => {
    expect(fieldNames(headingBlockSchema)).toEqual([
      'heading',
      'supportingText',
    ]);
  });

  it('does not carry an align field', () => {
    expect(fieldNames(headingBlockSchema)).not.toContain('align');
  });
});

describe('requiredHeadingBlockSchema shape', () => {
  it('carries only heading and supportingText', () => {
    expect(fieldNames(requiredHeadingBlockSchema)).toEqual([
      'heading',
      'supportingText',
    ]);
  });

  it('does not carry an align field', () => {
    expect(fieldNames(requiredHeadingBlockSchema)).not.toContain('align');
  });
});
