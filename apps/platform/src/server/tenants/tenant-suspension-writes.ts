import 'server-only';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import { queries, TENANT_STATUS, type TSuspensionStatus } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_LOG, TENANT_REFUSAL } from '@platform/constants/tenant';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  blockTenantOwnerEmail,
  confirmOwnerEmailBlock,
  type TSavedOwnerEmailBlock,
  undoOwnerEmailBlock,
} from '@platform/server/tenants/block-tenant-owner-email';
import {
  discardTenantSuspensionCase,
  type TSuspensionCase,
} from '@platform/server/tenants/tenant-suspension-case';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TSuspensionWriteFailure =
  | TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<
        | typeof TENANT_REFUSAL.ARCHIVED
        | typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN
      >);

export type TSuspensionWrite<TCase> = Promise<
  TResult<TCase, TSuspensionWriteFailure>
>;

export const ARCHIVED_REFUSAL: TSuspensionWriteFailure = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: TENANT_REFUSAL.ARCHIVED,
};

export const failWrite = (
  tenantId: string,
  status: TSuspensionStatus,
  error: unknown,
) => {
  logger.error(TENANT_LOG.SUSPENSION_SAVE_FAILED, {
    tenantId,
    status,
    ...toLoggableError(error),
  });
  return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
};

export const applyTenantSuspension = async (
  admin: TAdmin,
  tenantId: string,
  suspensionCase: TSuspensionCase,
  ownerBlockReason: TMaybeUndefined<string>,
): TSuspensionWrite<TTenantSuspension> => {
  let ownerBlock: TMaybeUndefined<TSavedOwnerEmailBlock>;
  let openedCase: TMaybeUndefined<TTenantSuspension>;
  let isSuspensionSaved = false;
  const rollBack = async () => {
    await discardTenantSuspensionCase(openedCase);
    await undoOwnerEmailBlock(ownerBlock);
  };

  try {
    if (ownerBlockReason) {
      const blocked = await blockTenantOwnerEmail(
        admin,
        tenantId,
        ownerBlockReason,
      );
      if (!blocked.ok) return errorResult(blocked.error);
      ownerBlock = blocked.data;
    }

    openedCase = await queries.tenantSuspensions.openTenantSuspension({
      tenantId,
      ...suspensionCase,
      suspendedBy: admin.id,
    });
    const updated = await queries.tenants.setTenantSuspension(
      tenantId,
      TENANT_STATUS.SUSPENDED,
    );
    if (!updated.ok) {
      await rollBack();
      return errorResult(ARCHIVED_REFUSAL);
    }
    isSuspensionSaved = true;
    await confirmOwnerEmailBlock(ownerBlock);
    await revalidateSiteConfig(tenantId);
    return okResult(openedCase);
  } catch (error) {
    if (!isSuspensionSaved) await rollBack();
    return failWrite(tenantId, TENANT_STATUS.SUSPENDED, error);
  }
};
