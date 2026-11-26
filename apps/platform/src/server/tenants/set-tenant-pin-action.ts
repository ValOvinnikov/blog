'use server';

import {
  TENANT_LOG,
  TENANT_REFUSAL,
  TENANTS_LIST_PURGE_ARGS,
} from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { tenantIdSchema } from '@platform/utils/tenant-id-schema/tenant-id-schema';
import {
  ACTION_OUTCOME,
  isOutcomeSuccess,
  type TActionResult,
} from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { revalidatePath } from 'next/cache';

export type TSetTenantPinActionResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof TENANT_REFUSAL.NOT_FOUND
>;

const NOT_FOUND = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: TENANT_REFUSAL.NOT_FOUND,
} as const;

const writePin = async (
  adminId: string,
  tenantId: string,
  isPinned: boolean,
): Promise<TSetTenantPinActionResult> => {
  if (!isPinned) {
    await queries.pinnedTenants.unpinTenant(adminId, tenantId);
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  }

  const result = await queries.pinnedTenants.pinTenant(adminId, tenantId);
  if (result.ok) return toOutcome(ACTION_OUTCOME.SUCCESS);
  if (result.error === ERROR_CODE.DB_NOT_FOUND) return NOT_FOUND;

  logger.error(TENANT_LOG.PIN_FAILED, { tenantId, error: result.error });
  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};

export const setTenantPinAction = async (
  tenantId: string,
  isPinned: boolean,
): Promise<TSetTenantPinActionResult> => {
  const { id: adminId } = await requireAdmin();

  const parsed = tenantIdSchema.safeParse(tenantId);
  if (!parsed.success) return NOT_FOUND;

  let result: TSetTenantPinActionResult;
  try {
    result = await writePin(adminId, parsed.data, isPinned);
  } catch (error) {
    logger.error(isPinned ? TENANT_LOG.PIN_FAILED : TENANT_LOG.UNPIN_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  if (isOutcomeSuccess(result)) revalidatePath(...TENANTS_LIST_PURGE_ARGS);
  return result;
};
