import { SANITY_PROJECT_ROLE } from '@shinefold/db/constants';
import { listMembersPendingStudioAccess } from '@shinefold/db/queries/memberships';
import { listTenantsPendingOwnerElevation } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  OWNER_ACCESS_LOG,
  OWNER_ACCESS_SWEEP_CHECKS,
  OWNER_ACCESS_SWEEP_STEP,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
import { wakeMemberAccess } from '@worker/utils/member-access-run/member-access-run';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { revokeLockedMembers } from './revoke-locked-members';
import { runSweepStep } from './run-sweep-step';

export type TOwnerAccessSweepResult = {
  checked: number;
  revoked: number;
  failed: number;
};

export async function runOwnerAccessSweep(): Promise<TOwnerAccessSweepResult> {
  const sweepStartedAt = Date.now();
  logger.info(OWNER_ACCESS_LOG.SWEEP_STARTED);
  const tenants = await runSweepStep(
    OWNER_ACCESS_SWEEP_STEP.LIST_TENANTS,
    {},
    listTenantsPendingOwnerElevation,
    (listed) => ({ pending: listed.length }),
  );
  const pending = tenants.filter(
    ({ ownerSanityRole }) =>
      ownerSanityRole !== SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );

  const result: TOwnerAccessSweepResult = { checked: 0, revoked: 0, failed: 0 };
  for (const { id: tenantId } of pending) {
    try {
      await runSweepStep(OWNER_ACCESS_SWEEP_STEP.WAKE_OWNER, { tenantId }, () =>
        wakeOwnerAccess(tenantId, OWNER_ACCESS_SWEEP_CHECKS),
      );
      result.checked++;
    } catch (error) {
      result.failed++;
      logger.error(OWNER_ACCESS_LOG.SWEEP_TENANT_FAILED, {
        tenantId,
        error: sanitizeLogMessage(error),
      });
    }
  }

  const members = await runSweepStep(
    OWNER_ACCESS_SWEEP_STEP.LIST_MEMBERS,
    {},
    listMembersPendingStudioAccess,
    (listed) => ({ pending: listed.length }),
  );
  for (const { tenantId, membershipId } of members) {
    try {
      await runSweepStep(
        OWNER_ACCESS_SWEEP_STEP.WAKE_MEMBER,
        { tenantId, membershipId },
        () =>
          wakeMemberAccess(tenantId, membershipId, OWNER_ACCESS_SWEEP_CHECKS),
      );
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

  const { revoked, failed } = await runSweepStep(
    OWNER_ACCESS_SWEEP_STEP.REVOKE_LOCKED_MEMBERS,
    {},
    revokeLockedMembers,
    (outcome) => outcome,
  );
  result.revoked = revoked;
  result.failed += failed;
  logger.info(OWNER_ACCESS_LOG.SWEEP_FINISHED, {
    ...result,
    durationMs: Date.now() - sweepStartedAt,
  });
  return result;
}
