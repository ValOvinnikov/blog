import {
  requiredHeadingSectionHeaderSchema,
  sectionHeaderSchema,
} from '@blog/studio/schema-types/objects/section-header';
import type { ObjectDefinition } from 'sanity';

const fieldNames = (schema: ObjectDefinition) =>
  schema.fields?.map((field) => field.name);

describe('sectionHeaderSchema shape', () => {
  it('carries only heading and supportingText', () => {
    expect(fieldNames(sectionHeaderSchema)).toEqual([
      'heading',
      'supportingText',
    ]);
  });

  it('does not carry an align field', () => {
    expect(fieldNames(sectionHeaderSchema)).not.toContain('align');
  });
});

describe('requiredHeadingSectionHeaderSchema shape', () => {
  it('carries only heading and supportingText', () => {
    expect(fieldNames(requiredHeadingSectionHeaderSchema)).toEqual([
      'heading',
      'supportingText',
    ]);
  });

  it('does not carry an align field', () => {
    expect(fieldNames(requiredHeadingSectionHeaderSchema)).not.toContain(
      'align',
    );
  });
});
