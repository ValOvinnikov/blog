import { faker } from '@faker-js/faker';

import {
  UNIQUE_VIOLATION_CODE,
  uniqueViolationConstraint,
} from './unique-violation';

faker.seed(6607);

const MOCK_CONSTRAINT = faker.lorem.slug(3);
const FOREIGN_KEY_VIOLATION_CODE = '23503';
const MOCK_UNIQUE_VIOLATION = {
  code: UNIQUE_VIOLATION_CODE,
  constraint: MOCK_CONSTRAINT,
};

describe(uniqueViolationConstraint, () => {
  it('reads the constraint off a driver error', () => {
    expect(uniqueViolationConstraint(MOCK_UNIQUE_VIOLATION)).toBe(
      MOCK_CONSTRAINT,
    );
  });

  it('reads the constraint off the cause of a wrapped error', () => {
    const wrapped = new Error(MOCK_CONSTRAINT, {
      cause: MOCK_UNIQUE_VIOLATION,
    });

    expect(uniqueViolationConstraint(wrapped)).toBe(MOCK_CONSTRAINT);
  });

  it('is undefined for a different Postgres error code', () => {
    const foreignKeyViolation = {
      code: FOREIGN_KEY_VIOLATION_CODE,
      constraint: MOCK_CONSTRAINT,
    };

    expect(uniqueViolationConstraint(foreignKeyViolation)).toBeUndefined();
  });

  it('is undefined for a violation that names no constraint', () => {
    expect(
      uniqueViolationConstraint({ code: UNIQUE_VIOLATION_CODE }),
    ).toBeUndefined();
  });

  it.each([null, undefined, MOCK_CONSTRAINT])(
    'is undefined for the non-error value %s',
    (error) => {
      expect(uniqueViolationConstraint(error)).toBeUndefined();
    },
  );
});
