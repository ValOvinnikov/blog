import { SELF_SERVE_FREE_OWNER_INDEX_NAME } from '@blog/db/schema/tenants';
import { uniqueViolationConstraint } from '@blog/db/utils/unique-violation/unique-violation';

export function isFreeOwnerViolation(error: unknown): boolean {
  return uniqueViolationConstraint(error) === SELF_SERVE_FREE_OWNER_INDEX_NAME;
}
