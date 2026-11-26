'use server';

import {
  TENANT_LOG,
  TENANT_REFUSAL,
  TENANTS_LIST_ROUTE,
} from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { logger } from '@platform/utils/logger/logger';
import { tenantIdSchema } from '@platform/utils/tenant-id-schema/tenant-id-schema';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { revalidatePath } from 'next/cache';

export type TPinTenantActionResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof TENANT_REFUSAL.NOT_FOUND
>;

export const pinTenantAction = async (
  tenantId: string,
): Promise<TPinTenantActionResult> => {
  const { id: adminId } = await requireAdmin();

  const parsed = tenantIdSchema.safeParse(tenantId);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }

  const result = await queries.pinnedTenants.pinTenant(adminId, parsed.data);
  if (!result.ok) {
    if (result.error === ERROR_CODE.DB_NOT_FOUND) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.NOT_FOUND,
      };
    }
    logger.error(TENANT_LOG.PIN_FAILED, { tenantId, error: result.error });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  revalidatePath(TENANTS_LIST_ROUTE, 'page');
  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
