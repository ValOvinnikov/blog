import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';
import { faker } from '@faker-js/faker';
import { defineField, defineType } from 'sanity';

faker.seed(6017);

const TITLE_FIELD = 'title';
const PAGE_SIZE_FIELD = 'pageSize';

const MOCK_TITLE = faker.lorem.words(3);
const MOCK_PAGE_SIZE = faker.number.int({ min: 1, max: 24 });
const MOCK_PAGE_SIZE_EXEMPTION = {
  name: PAGE_SIZE_FIELD,
  reason: faker.lorem.sentence(),
};

const MOCK_SCHEMA = defineType({
  name: 'testing_fixture',
  title: 'Testing Fixture',
  type: 'document',
  fields: [
    defineField({
      name: TITLE_FIELD,
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: PAGE_SIZE_FIELD,
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

const MOCK_NO_VALIDATION_SCHEMA = defineType({
  name: 'testing_no_validation',
  title: 'Testing No Validation',
  type: 'document',
  fields: [defineField({ name: 'note', title: 'Note', type: 'string' })],
});

describe(assertSatisfiesRequiredFields, () => {
  it('passes when every required field is set and an optional one is omitted', () => {
    expect(() =>
      assertSatisfiesRequiredFields(MOCK_SCHEMA, {
        [TITLE_FIELD]: MOCK_TITLE,
        [PAGE_SIZE_FIELD]: MOCK_PAGE_SIZE,
      }),
    ).not.toThrow();
  });

  it('throws naming a required field missing from the payload', () => {
    expect(() =>
      assertSatisfiesRequiredFields(MOCK_SCHEMA, { [TITLE_FIELD]: MOCK_TITLE }),
    ).toThrow(PAGE_SIZE_FIELD);
  });

  it('treats a field with no validation function as never required', () => {
    expect(() =>
      assertSatisfiesRequiredFields(MOCK_NO_VALIDATION_SCHEMA, {}),
    ).not.toThrow();
  });

  it('passes when the missing required field is exempt', () => {
    expect(() =>
      assertSatisfiesRequiredFields(
        MOCK_SCHEMA,
        { [TITLE_FIELD]: MOCK_TITLE },
        [MOCK_PAGE_SIZE_EXEMPTION],
      ),
    ).not.toThrow();
  });

  it('still throws for a missing required field that is not exempt', () => {
    expect(() =>
      assertSatisfiesRequiredFields(MOCK_SCHEMA, {}, [
        MOCK_PAGE_SIZE_EXEMPTION,
      ]),
    ).toThrow(TITLE_FIELD);
  });
});
