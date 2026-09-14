type TValidatorLevel = 'error' | 'warning';

export type TRecordedValidator<TFn> = {
  fn: TFn;
  level: TValidatorLevel;
};

type TValidatedSource = { validation?: unknown; name?: string };

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
 * Exercises a field's or document's `validation` builder against a minimal
 * chainable mock `Rule` and records each `custom()` callback in registration
 * order, along with its severity — a validator defaults to `'error'` and
 * only becomes `'warning'` when `.warning()` is chained onto that same
 * `.custom()` call.
 */
export const getRecordedValidators = <TFn>(
  source: TValidatedSource | undefined,
): TRecordedValidator<TFn>[] => {
  if (typeof source?.validation !== 'function') {
    throw new Error(
      source?.name
        ? `Expected ${source.name} to define validation.`
        : 'Expected validation to define a builder function.',
    );
  }

  const recorded: TRecordedValidator<TFn>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (source.validation as any)(createRecordingRule<TFn>(recorded));

  return recorded;
};

const getSingleRecordedValidator = <TFn>(
  source: TValidatedSource | undefined,
): TRecordedValidator<TFn> => {
  const validators = getRecordedValidators<TFn>(source);
  const label = source?.name ? `${source.name} validation` : 'validation';

  if (validators.length === 0) {
    throw new Error(`Expected ${label} to register a custom() rule.`);
  }

  if (validators.length > 1) {
    throw new Error(
      `Expected ${label} to register exactly one custom() rule, found ${validators.length}.`,
    );
  }

  return validators[0]!;
};

/**
 * Asserts a `validation` builder registered exactly one `custom()` rule and
 * returns its callback, for the common case of a single field-level check.
 */
export const getCustomValidator = <TFn>(
  source: TValidatedSource | undefined,
): TFn => getSingleRecordedValidator<TFn>(source).fn;

/**
 * Same as `getCustomValidator`, but also reports whether that single rule
 * was chained to `.warning()` rather than left at the default error severity
 * — for schemas (typically documents) that keep the validator private and
 * never export it directly.
 */
export const getCustomValidatorWithLevel = <TFn>(
  source: TValidatedSource | undefined,
): { fn: TFn; isWarning: boolean } => {
  const validator = getSingleRecordedValidator<TFn>(source);

  return { fn: validator.fn, isWarning: validator.level === 'warning' };
};
