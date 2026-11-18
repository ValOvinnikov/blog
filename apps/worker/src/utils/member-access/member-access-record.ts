import { ERROR_CODE } from '@shinefold/config/constants';
import {
  setMemberStudioAccess,
  type TSetMemberStudioAccessInput,
} from '@shinefold/db/queries/memberships';

import type { TMemberAccessTarget } from './member-access-target';

// Resolves false once the membership has been removed, so the caller can undo what it just did in Sanity.
export async function recordMemberAccess(
  target: TMemberAccessTarget,
  patch: TSetMemberStudioAccessInput,
): Promise<boolean> {
  const { tenantId, membershipId } = target;
  const recorded = await setMemberStudioAccess(tenantId, membershipId, patch);
  if (recorded.ok) return true;
  if (recorded.error === ERROR_CODE.DB_NOT_FOUND) return false;
  throw new Error(
    `Membership "${membershipId}"'s Studio access could not be recorded (${recorded.error}).`,
  );
}
