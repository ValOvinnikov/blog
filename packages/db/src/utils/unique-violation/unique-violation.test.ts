import {
  UNIQUE_VIOLATION_CODE,
  uniqueViolationConstraint,
} from './unique-violation';

const CONSTRAINT = 'some_unique_idx';
const FOREIGN_KEY_VIOLATION_CODE = '23503';
const UNIQUE_VIOLATION = {
  code: UNIQUE_VIOLATION_CODE,
  constraint: CONSTRAINT,
};

describe(uniqueViolationConstraint, () => {
  it('reads the constraint off a driver error', () => {
    expect(uniqueViolationConstraint(UNIQUE_VIOLATION)).toBe(CONSTRAINT);
  });

  it('reads the constraint off the cause of a wrapped error', () => {
    const wrapped = new Error(CONSTRAINT, { cause: UNIQUE_VIOLATION });

    expect(uniqueViolationConstraint(wrapped)).toBe(CONSTRAINT);
  });

  it('is undefined for a different Postgres error code', () => {
    expect(
      uniqueViolationConstraint({
        code: FOREIGN_KEY_VIOLATION_CODE,
        constraint: CONSTRAINT,
      }),
    ).toBeUndefined();
  });

  it('is undefined for a violation that names no constraint', () => {
    expect(
      uniqueViolationConstraint({ code: UNIQUE_VIOLATION_CODE }),
    ).toBeUndefined();
  });

  it.each([null, undefined, CONSTRAINT])(
    'is undefined for the non-error value %s',
    (error) => {
      expect(uniqueViolationConstraint(error)).toBeUndefined();
    },
  );
});
