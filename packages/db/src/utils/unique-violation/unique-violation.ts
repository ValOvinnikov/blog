import type { TMaybeUndefined } from '@blog/config/types';

export const UNIQUE_VIOLATION_CODE = '23505';
const MAX_CAUSE_DEPTH = 3;

type TDriverError = {
  code?: unknown;
  constraint?: string;
  cause?: unknown;
};

// Drizzle wraps the driver error, so the Postgres code and constraint sit on `cause`.
export function uniqueViolationConstraint(
  error: unknown,
  depth = 0,
): TMaybeUndefined<string> {
  if (depth > MAX_CAUSE_DEPTH || !(error instanceof Object)) return undefined;

  const { code, constraint, cause } = error as TDriverError;
  if (code === UNIQUE_VIOLATION_CODE && constraint !== undefined) {
    return constraint;
  }

  return uniqueViolationConstraint(cause, depth + 1);
}
