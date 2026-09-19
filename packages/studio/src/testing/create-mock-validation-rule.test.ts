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
    expect(getRecordedBounds(boundedField)).toEqual({ min: 3, max: 10 });
  });

  it('leaves a bound unset when the chain never calls it', () => {
    expect(getRecordedBounds(singleRuleField)).toEqual({});
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
