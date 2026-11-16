import { SELF_SERVE_FREE_OWNER_INDEX_NAME } from '@shinefold/db/schema/tenant-self-serve-owner-index';
import { uniqueViolationConstraint } from '@shinefold/db/utils/constraint-violation/constraint-violation';

export function isFreeOwnerViolation(error: unknown): boolean {
  return uniqueViolationConstraint(error) === SELF_SERVE_FREE_OWNER_INDEX_NAME;
}
