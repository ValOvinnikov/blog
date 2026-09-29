import {
  getCustomValidator,
  getCustomValidatorWithLevel,
  getRecordedBounds,
  getRecordedValidators,
} from '@blog/studio/testing/create-mock-validation-rule';
import { defineField, defineType } from 'sanity';

type TStringCustomFn = (value: string | undefined) => string | true;

const singleRuleField = defineField({
  name: 'title',
  title: 'Title',
  type: 'string',
  validation: (rule) =>
    rule.custom((value: string | undefined) =>
      value ? true : 'Title is required.',
    ),
});

const severityRuleField = defineField({
  name: 'note',
  title: 'Note',
  type: 'string',
  validation: (rule) =>
    rule
      .custom((value: string | undefined) =>
        value ? true : 'A note is recommended.',
      )
      .warning(),
});

const noValidationField = defineField({
  name: 'plain',
  title: 'Plain',
  type: 'string',
});

const boundedField = defineField({
  name: 'summary',
  title: 'Summary',
  type: 'string',
  validation: (rule) => rule.required().min(3).max(10),
});

const uniqueArrayField = defineField({
  name: 'tags',
  title: 'Tags',
  type: 'array',
  of: [{ type: 'string' }],
  validation: (rule) => rule.unique().min(1).max(8),
});

const independentRulesArrayField = defineField({
  name: 'cards',
  title: 'Cards',
  type: 'array',
  of: [{ type: 'string' }],
  validation: (rule) => [
    rule.required().error('Add at least two cards.'),
    rule.unique().error('Each card can only appear once.'),
    rule.min(2).error('Needs at least two cards.'),
    rule.max(8).error('Holds at most eight cards.'),
  ],
});

const documentType = defineType({
  name: 'testing_document',
  title: 'Testing Document',
  type: 'document',
  validation: (rule) => [
    rule.custom(() => 'first error'),
    rule.custom(() => 'second warning').warning(),
  ],
  fields: [singleRuleField],
});

describe(getRecordedValidators, () => {
  it('records every custom() callback in registration order, with its level', () => {
    const validators = getRecordedValidators<TStringCustomFn>(documentType);

    expect(validators).toHaveLength(2);
    expect(validators[0]!.level).toBe('error');
    expect(validators[1]!.level).toBe('warning');
  });

  it('throws when the source defines no validation builder', () => {
    expect(() =>
      getRecordedValidators<TStringCustomFn>(noValidationField),
    ).toThrow(/validation/);
  });
});

describe(getRecordedBounds, () => {
  it('captures the numeric arguments passed to min() and max()', () => {
    expect(getRecordedBounds(boundedField)).toEqual({
      required: true,
      min: 3,
      max: 10,
    });
  });

  it('captures whether unique() was chained', () => {
    expect(getRecordedBounds(uniqueArrayField)).toEqual({
      unique: true,
      min: 1,
      max: 8,
    });
  });

  it('leaves a bound unset when the chain never calls it', () => {
    expect(getRecordedBounds(singleRuleField)).toEqual({});
  });

  it('captures every rule when validation returns an array of independent rules', () => {
    expect(getRecordedBounds(independentRulesArrayField)).toEqual({
      required: true,
      unique: true,
      min: 2,
      max: 8,
    });
  });

  it('throws when the source defines no validation builder', () => {
    expect(() => getRecordedBounds(noValidationField)).toThrow(/validation/);
  });
});

describe(getCustomValidator, () => {
  it('returns the single registered callback', () => {
    const validate = getCustomValidator<TStringCustomFn>(singleRuleField);

    expect(validate(undefined)).toBe('Title is required.');
    expect(validate('Hello')).toBe(true);
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
    expect(() => getCustomValidator<TStringCustomFn>(documentType)).toThrow(
      /exactly one/,
    );
  });
});

describe(getCustomValidatorWithLevel, () => {
  it('reports error severity by default', () => {
    const { isWarning } =
      getCustomValidatorWithLevel<TStringCustomFn>(singleRuleField);

    expect(isWarning).toBe(false);
  });

  it('reports warning severity when .warning() is chained', () => {
    const { fn, isWarning } =
      getCustomValidatorWithLevel<TStringCustomFn>(severityRuleField);

    expect(isWarning).toBe(true);
    expect(fn(undefined)).toBe('A note is recommended.');
  });
});
