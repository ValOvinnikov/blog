import { headingBlockSchema } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';
import type { ObjectDefinition } from 'sanity';

const fieldNames = (schema: ObjectDefinition) =>
  schema.fields?.map((field) => field.name);

const findField = (schema: ObjectDefinition, name: string) => {
  const field = schema.fields?.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Expected ${schema.name} to define a "${name}" field.`);
  }

  return field;
};

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

  it('is collapsible and expanded by default', () => {
    expect(headingBlockSchema.options).toEqual({
      collapsible: true,
      collapsed: false,
    });
  });

  it('requires heading', () => {
    const field = findField(headingBlockSchema, 'heading');

    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('defines no validation on supportingText', () => {
    const field = findField(headingBlockSchema, 'supportingText');

    expect(field.validation).toBeUndefined();
  });
});
