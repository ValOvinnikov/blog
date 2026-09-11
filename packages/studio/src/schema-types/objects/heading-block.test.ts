import {
  headingBlockSchema,
  requiredHeadingBlockSchema,
} from '@blog/studio/schema-types/objects/heading-block';
import type { ObjectDefinition } from 'sanity';

const fieldNames = (schema: ObjectDefinition) =>
  schema.fields?.map((field) => field.name);

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  required: () => TMockRule;
};

const createMockRule = (callLog: TCallLog): TMockRule => ({
  required: () => {
    callLog.push({ method: 'required', args: [] });
    return createMockRule(callLog);
  },
});

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

  it('defines no validation on heading', () => {
    const field = findField(headingBlockSchema, 'heading');

    expect(field.validation).toBeUndefined();
  });

  it('defines no validation on supportingText', () => {
    const field = findField(headingBlockSchema, 'supportingText');

    expect(field.validation).toBeUndefined();
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

  it('is collapsible and expanded by default', () => {
    expect(requiredHeadingBlockSchema.options).toEqual({
      collapsible: true,
      collapsed: false,
    });
  });

  it('requires heading, with no further validation calls', () => {
    const field = findField(requiredHeadingBlockSchema, 'heading');

    if (!field.validation) {
      throw new Error('Expected heading to define validation.');
    }

    const callLog: TCallLog = [];
    const rule = createMockRule(callLog);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(callLog).toEqual([{ method: 'required', args: [] }]);
  });

  it('defines no validation on supportingText', () => {
    const field = findField(requiredHeadingBlockSchema, 'supportingText');

    expect(field.validation).toBeUndefined();
  });
});
