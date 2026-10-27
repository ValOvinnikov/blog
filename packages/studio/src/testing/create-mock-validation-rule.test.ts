import type { TMaybeUndefined } from '@blog/config/types';
import {
  getCustomValidator,
  getCustomValidatorWithLevel,
  getRecordedBounds,
  getRecordedValidators,
} from '@blog/studio/testing/create-mock-validation-rule';
import { faker } from '@faker-js/faker';
import { defineField, defineType } from 'sanity';

type TStringCustomFn = (value: TMaybeUndefined<string>) => string | true;

faker.seed(6017);

const MOCK_TITLE = faker.lorem.words(3);
const MOCK_REQUIRED_MESSAGE = faker.lorem.sentence();
const MOCK_RECOMMENDED_MESSAGE = faker.lorem.sentence();
const MOCK_DOCUMENT_ERROR = faker.lorem.sentence();
const MOCK_DOCUMENT_WARNING = faker.lorem.sentence();

const MOCK_SINGLE_RULE_FIELD = defineField({
  name: 'title',
  title: 'Title',
  type: 'string',
  validation: (rule) =>
    rule.custom((value: TMaybeUndefined<string>) =>
      value ? true : MOCK_REQUIRED_MESSAGE,
    ),
});

const MOCK_WARNING_RULE_FIELD = defineField({
  name: 'note',
  title: 'Note',
  type: 'string',
  validation: (rule) =>
    rule
      .custom((value: TMaybeUndefined<string>) =>
        value ? true : MOCK_RECOMMENDED_MESSAGE,
      )
      .warning(),
});

const MOCK_NO_VALIDATION_FIELD = defineField({
  name: 'plain',
  title: 'Plain',
  type: 'string',
});

const MOCK_BOUNDED_FIELD = defineField({
  name: 'summary',
  title: 'Summary',
  type: 'string',
  validation: (rule) => rule.required().min(3).max(10),
});

const MOCK_UNIQUE_ARRAY_FIELD = defineField({
  name: 'tags',
  title: 'Tags',
  type: 'array',
  of: [{ type: 'string' }],
  validation: (rule) => rule.unique().min(1).max(8),
});

const MOCK_INDEPENDENT_RULES_ARRAY_FIELD = defineField({
  name: 'cards',
  title: 'Cards',
  type: 'array',
  of: [{ type: 'string' }],
  validation: (rule) => [
    rule.required().error(faker.lorem.sentence()),
    rule.unique().error(faker.lorem.sentence()),
    rule.min(2).error(faker.lorem.sentence()),
    rule.max(8).error(faker.lorem.sentence()),
  ],
});

const MOCK_DOCUMENT_TYPE = defineType({
  name: 'testing_document',
  title: 'Testing Document',
  type: 'document',
  validation: (rule) => [
    rule.custom(() => MOCK_DOCUMENT_ERROR),
    rule.custom(() => MOCK_DOCUMENT_WARNING).warning(),
  ],
  fields: [MOCK_SINGLE_RULE_FIELD],
});

describe(getRecordedValidators, () => {
  it('records every custom() callback in registration order, with its level', () => {
    const validators =
      getRecordedValidators<TStringCustomFn>(MOCK_DOCUMENT_TYPE);

    expect(validators.map(({ level }) => level)).toEqual(['error', 'warning']);
  });

  it('throws when the source defines no validation builder', () => {
    expect(() =>
      getRecordedValidators<TStringCustomFn>(MOCK_NO_VALIDATION_FIELD),
    ).toThrow(/validation/);
  });
});

describe(getRecordedBounds, () => {
  it.each([
    {
      chain: 'required(), min() and max()',
      field: MOCK_BOUNDED_FIELD,
      bounds: { required: true, min: 3, max: 10 },
    },
    {
      chain: 'unique(), min() and max()',
      field: MOCK_UNIQUE_ARRAY_FIELD,
      bounds: { unique: true, min: 1, max: 8 },
    },
    {
      chain: 'no bound',
      field: MOCK_SINGLE_RULE_FIELD,
      bounds: {},
    },
    {
      chain: 'an array of independent rules',
      field: MOCK_INDEPENDENT_RULES_ARRAY_FIELD,
      bounds: { required: true, unique: true, min: 2, max: 8 },
    },
  ])('captures the bounds of $chain', ({ field, bounds }) => {
    expect(getRecordedBounds(field)).toEqual(bounds);
  });

  it('throws for a field with no validation builder', () => {
    expect(() => getRecordedBounds(MOCK_NO_VALIDATION_FIELD)).toThrow(
      /validation/,
    );
  });
});

describe(getCustomValidator, () => {
  it('returns the single registered callback', () => {
    const validate = getCustomValidator<TStringCustomFn>(
      MOCK_SINGLE_RULE_FIELD,
    );

    expect(validate(undefined)).toBe(MOCK_REQUIRED_MESSAGE);
    expect(validate(MOCK_TITLE)).toBe(true);
  });

  it('throws when no custom() rule was registered', () => {
    const requiredOnlyField = defineField({
      name: 'requiredOnly',
      title: 'Required Only',
      type: 'string',
      validation: (rule) => rule.required(),
    });

    expect(() =>
      getCustomValidator<TStringCustomFn>(requiredOnlyField),
    ).toThrow(/custom/);
  });

  it('throws when more than one custom() rule was registered', () => {
    expect(() =>
      getCustomValidator<TStringCustomFn>(MOCK_DOCUMENT_TYPE),
    ).toThrow(/exactly one/);
  });
});

describe(getCustomValidatorWithLevel, () => {
  it('reports error severity by default', () => {
    const { isWarning } = getCustomValidatorWithLevel<TStringCustomFn>(
      MOCK_SINGLE_RULE_FIELD,
    );

    expect(isWarning).toBe(false);
  });

  it('reports warning severity when .warning() is chained', () => {
    const { fn, isWarning } = getCustomValidatorWithLevel<TStringCustomFn>(
      MOCK_WARNING_RULE_FIELD,
    );

    expect(isWarning).toBe(true);
    expect(fn(undefined)).toBe(MOCK_RECOMMENDED_MESSAGE);
  });
});
