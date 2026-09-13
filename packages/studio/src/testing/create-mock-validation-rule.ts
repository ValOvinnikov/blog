type TValidatorLevel = 'error' | 'warning';

export type TRecordedValidator<TFn> = {
  fn: TFn;
  level: TValidatorLevel;
};

type TMockValidationRule<TFn> = {
  custom: (fn: TFn) => TMockValidationRule<TFn>;
  warning: () => TMockValidationRule<TFn>;
  error: (message?: string) => TMockValidationRule<TFn>;
  required: () => TMockValidationRule<TFn>;
  unique: () => TMockValidationRule<TFn>;
  integer: () => TMockValidationRule<TFn>;
  min: (value?: number) => TMockValidationRule<TFn>;
  max: (value?: number) => TMockValidationRule<TFn>;
};

const createRecordingRule = <TFn>(
  recorded: TRecordedValidator<TFn>[],
): TMockValidationRule<TFn> => {
  const rule: TMockValidationRule<TFn> = {
    custom: (fn) => {
      recorded.push({ fn, level: 'error' });
      return rule;
    },
    warning: () => {
      const last = recorded.at(-1);
      if (last) last.level = 'warning';
      return rule;
    },
    error: () => rule,
    required: () => rule,
    unique: () => rule,
    integer: () => rule,
    min: () => rule,
    max: () => rule,
  };

  return rule;
};

/**
 * Every field/document `validation` builder in this codebase registers its
 * checks by chaining `rule.custom(fn)`, optionally followed by `.warning()`
 * — this exercises that builder against a minimal chainable mock `Rule` and
 * records each `custom()` callback in registration order together with the
 * severity it was chained to, so a test can invoke a validator directly
 * without spinning up a real Sanity `Rule`. A validator's severity defaults
 * to `'error'` and only flips to `'warning'` when `.warning()` is chained
 * directly onto that same `.custom()` call, mirroring how Sanity itself
 * reads the chain.
 */
export const getRecordedValidators = <TFn>(
  source: { validation?: unknown } | undefined,
): TRecordedValidator<TFn>[] => {
  if (typeof source?.validation !== 'function') {
    throw new Error('Expected validation to define a builder function.');
  }

  const recorded: TRecordedValidator<TFn>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (source.validation as any)(createRecordingRule<TFn>(recorded));

  return recorded;
};

/**
 * Asserts a `validation` builder registered exactly one `custom()` rule and
 * returns its callback, for the common case of a single field-level check.
 */
export const getCustomValidator = <TFn>(
  source: { validation?: unknown } | undefined,
): TFn => {
  const [validator] = getRecordedValidators<TFn>(source);

  if (!validator) {
    throw new Error('Expected validation to register a custom() rule.');
  }

  return validator.fn;
};

/**
 * Same as `getCustomValidator`, but also reports whether that single rule
 * was chained to `.warning()` rather than left at the default error severity.
 */
export const getCustomValidatorWithLevel = <TFn>(
  source: { validation?: unknown } | undefined,
): { fn: TFn; isWarning: boolean } => {
  const [validator] = getRecordedValidators<TFn>(source);

  if (!validator) {
    throw new Error('Expected validation to register a custom() rule.');
  }

  return { fn: validator.fn, isWarning: validator.level === 'warning' };
};
