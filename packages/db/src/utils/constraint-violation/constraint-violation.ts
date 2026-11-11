import type { TMaybeUndefined } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';

export const UNIQUE_VIOLATION_CODE = '23505';
export const FOREIGN_KEY_VIOLATION_CODE = '23503';
const MAX_CAUSE_DEPTH = 3;

type TDriverError = {
  code?: unknown;
  constraint?: string;
  cause?: unknown;
};

// Drizzle wraps the driver error, so the Postgres code and constraint sit on `cause`.
function violatedConstraint(
  error: unknown,
  violationCode: string,
  depth = 0,
): TMaybeUndefined<string> {
  if (depth > MAX_CAUSE_DEPTH || !(error instanceof Object)) return undefined;

  const { code, constraint, cause } = error as TDriverError;
  if (code === violationCode && !isUndefined(constraint)) return constraint;

  return violatedConstraint(cause, violationCode, depth + 1);
}

export function uniqueViolationConstraint(
  error: unknown,
): TMaybeUndefined<string> {
  return violatedConstraint(error, UNIQUE_VIOLATION_CODE);
}

export function foreignKeyViolationConstraint(
  error: unknown,
): TMaybeUndefined<string> {
  return violatedConstraint(error, FOREIGN_KEY_VIOLATION_CODE);
}
