import { SANITY_PROJECT_ROLE } from '@shinefold/db/constants';
import { listMembersPendingStudioAccess } from '@shinefold/db/queries/memberships';
import { listTenantsPendingOwnerElevation } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  OWNER_ACCESS_LOG,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
import { wakeMemberAccess } from '@worker/utils/member-access-run/member-access-run';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

export type TOwnerAccessSweepResult = { checked: number; failed: number };

export async function runOwnerAccessSweep(): Promise<TOwnerAccessSweepResult> {
  const tenants = await listTenantsPendingOwnerElevation();
  const pending = tenants.filter(
    ({ ownerSanityRole }) =>
      ownerSanityRole !== SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );

  const result: TOwnerAccessSweepResult = { checked: 0, failed: 0 };
  for (const { id: tenantId } of pending) {
    try {
      await wakeOwnerAccess(tenantId, OWNER_ACCESS_SWEEP_CHECKS);
      result.checked++;
    } catch (error) {
      result.failed++;
      logger.error(OWNER_ACCESS_LOG.SWEEP_TENANT_FAILED, {
        tenantId,
        error: sanitizeLogMessage(error),
      });
    }
  }

  for (const {
    tenantId,
    membershipId,
  } of await listMembersPendingStudioAccess()) {
    try {
      await wakeMemberAccess(tenantId, membershipId, OWNER_ACCESS_SWEEP_CHECKS);
      result.checked++;
    } catch (error) {
      result.failed++;
      logger.error(MEMBER_ACCESS_LOG.SWEEP_MEMBER_FAILED, {
        tenantId,
        membershipId,
        error: sanitizeLogMessage(error),
      });
    }
  }
  return result;
}
