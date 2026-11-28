import 'server-only';

import { TENANT_REFUSAL, TENANT_LOG } from '@platform/constants/tenant';
import { saveSignupBlock } from '@platform/server/signup-block/add-signup-block';
import {
  recordOwnerBlockRemoved,
  recordSignupBlockAdded,
} from '@platform/server/signup-block/signup-block-audit';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TOutcome,
  type TReasonedFailure,
} from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { BLOCKED_IDENTITY_KIND, queries } from '@shinefold/db';
import type { TAddBlockedIdentityOutcome } from '@shinefold/db/queries/blocked-signup-identities/add-blocked-identity';
import type { TAdmin } from '@shinefold/db/schema/admins';
import type { TTenantSuspension } from '@shinefold/db/schema/tenant-suspensions';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { toOutcome } from '@shinefold/utils/to-outcome';

type TBlockTenantOwnerEmailFailure =
  | TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN>);

export type TSavedOwnerEmailBlock = TAddBlockedIdentityOutcome & {
  reason: string;
  tenantId: string;
};

export const blockTenantOwnerEmail = async (
  admin: TAdmin,
  tenantId: string,
  reason: string,
): Promise<TResult<TSavedOwnerEmailBlock, TBlockTenantOwnerEmailFailure>> => {
  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
    });
  }

  const saved = await saveSignupBlock({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    identity: ownerEmail,
    reason,
    admin,
  });
  if (saved.ok) return okResult({ ...saved.data, reason, tenantId });

  logger.error(TENANT_LOG.SUSPENSION_BLOCK_FAILED, {
    tenantId,
    error: saved.error,
  });
  return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
};

export const confirmOwnerEmailBlock = async (
  block: TMaybeUndefined<TSavedOwnerEmailBlock>,
): Promise<void> => {
  if (block?.created) {
    await recordSignupBlockAdded(block.entry, block.reason, block.tenantId);
  }
};

export const undoOwnerEmailBlock = async (
  block: TMaybeUndefined<TSavedOwnerEmailBlock>,
): Promise<void> => {
  if (!block?.created) return;

  const entryId = block.entry.id;
  try {
    const removed =
      await queries.blockedSignupIdentities.removeBlockedIdentity(entryId);
    if (!removed.ok) {
      logger.error(TENANT_LOG.SUSPENSION_BLOCK_UNDO_FAILED, {
        entryId,
        error: removed.error,
      });
    }
  } catch (error) {
    logger.error(TENANT_LOG.SUSPENSION_BLOCK_UNDO_FAILED, {
      entryId,
      ...toLoggableError(error),
    });
  }
};

export const ownerBlockIdOf = (
  block: TMaybeUndefined<TSavedOwnerEmailBlock>,
): TMaybeUndefined<string> => (block?.created ? block.entry.id : undefined);

export const removeSuspensionOwnerBlock = async ({
  tenantId,
  ownerBlockId,
}: TTenantSuspension): Promise<void> => {
  if (!ownerBlockId) return;

  try {
    const removed =
      await queries.blockedSignupIdentities.removeBlockedIdentity(ownerBlockId);
    if (removed.ok) {
      await recordOwnerBlockRemoved(ownerBlockId, tenantId);
    } else if (removed.error !== ERROR_CODE.DB_NOT_FOUND) {
      logger.error(TENANT_LOG.SUSPENSION_BLOCK_LIFT_FAILED, {
        tenantId,
        entryId: ownerBlockId,
        error: removed.error,
      });
    }
  } catch (error) {
    logger.error(TENANT_LOG.SUSPENSION_BLOCK_LIFT_FAILED, {
      tenantId,
      entryId: ownerBlockId,
      ...toLoggableError(error),
    });
  }
};
