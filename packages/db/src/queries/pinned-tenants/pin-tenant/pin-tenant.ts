import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { pinnedTenants } from '@shinefold/db/schema/pinned-tenants';
import { foreignKeyViolationConstraint } from '@shinefold/db/utils/constraint-violation/constraint-violation';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { isUndefined } from '@shinefold/utils/primitives';

export async function pinTenant(
  adminId: string,
  tenantId: string,
): Promise<TResult<void, TErrorCode>> {
  if (!isUuid(adminId) || !isUuid(tenantId)) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  try {
    await getDb()
      .insert(pinnedTenants)
      .values({ adminId, tenantId })
      .onConflictDoNothing();
  } catch (error) {
    if (isUndefined(foreignKeyViolationConstraint(error))) throw error;
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult();
}
