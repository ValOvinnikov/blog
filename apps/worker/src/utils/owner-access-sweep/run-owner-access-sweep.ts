import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import { listTenantsPendingOwnerElevation } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  OWNER_ACCESS_LOG,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
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
  return result;
}
