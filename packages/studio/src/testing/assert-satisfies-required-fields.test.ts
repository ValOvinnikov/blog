import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';
import { defineField, defineType } from 'sanity';

const fixtureSchema = defineType({
  name: 'testing_fixture',
  title: 'Testing Fixture',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pageSize',
      title: 'Page Size',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(24),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
});

describe('assertSatisfiesRequiredFields', () => {
  it('passes when every required field is present in the payload', () => {
    expect(() =>
      assertSatisfiesRequiredFields(fixtureSchema, {
        title: 'Hello',
        pageSize: 9,
      }),
    ).not.toThrow();
  });

  it('throws when a required field is missing from the payload', () => {
    expect(() =>
      assertSatisfiesRequiredFields(fixtureSchema, { title: 'Hello' }),
    ).toThrow(/pageSize/);
  });

  it('ignores optional fields entirely — omitting one never throws', () => {
    expect(() =>
      assertSatisfiesRequiredFields(fixtureSchema, {
        title: 'Hello',
        pageSize: 9,
      }),
    ).not.toThrow();
  });

  it('treats a field with no validation function as never required', () => {
    const noValidationSchema = defineType({
      name: 'testing_no_validation',
      title: 'Testing No Validation',
      type: 'document',
      fields: [defineField({ name: 'note', title: 'Note', type: 'string' })],
    });

    expect(() =>
      assertSatisfiesRequiredFields(noValidationSchema, {}),
    ).not.toThrow();
  });
});
