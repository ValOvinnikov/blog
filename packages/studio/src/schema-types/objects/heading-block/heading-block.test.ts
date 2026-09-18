import { headingBlockSchema } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { getField } from '@blog/studio/testing/get-field';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';
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

  it('is collapsible and expanded by default', () => {
    expect(headingBlockSchema.options).toEqual({
      collapsible: true,
      collapsed: false,
    });
  });

  it('requires heading', () => {
    const field = getField(headingBlockSchema, 'heading');

    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('defines no validation on supportingText', () => {
    const field = getField(headingBlockSchema, 'supportingText');

    expect(field.validation).toBeUndefined();
  });
});
