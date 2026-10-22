import 'server-only';

import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import { BLOCKED_IDENTITY_KIND, queries } from '@blog/db';
import type { TAddBlockedIdentityOutcome } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import {
  recordSignupBlockAdded,
  saveSignupBlock,
} from '@platform/server/signup-block/add-signup-block';
import { logger } from '@platform/utils/logger/logger';

const UNDO_FAILED_EVENT = 'tenant.suspension_block_undo_failed';

type TBlockTenantOwnerEmailFailure =
  | TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN>);

export type TSavedOwnerEmailBlock = TAddBlockedIdentityOutcome & {
  reason: string;
};

export const blockTenantOwnerEmail = async (
  admin: TAdmin,
  tenantId: string,
  reason: string,
): Promise<TResult<TSavedOwnerEmailBlock, TBlockTenantOwnerEmailFailure>> => {
  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    return {
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
      },
    };
  }

  const saved = await saveSignupBlock({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    identity: ownerEmail,
    reason,
    admin,
  });
  if (saved.ok) return { ok: true, data: { ...saved.data, reason } };

  logger.error('tenant.suspension_block_failed', {
    tenantId,
    error: saved.error,
  });
  return { ok: false, error: toOutcome(ACTION_OUTCOME.SERVER_ERROR) };
};

export const confirmOwnerEmailBlock = async (
  block: TMaybeUndefined<TSavedOwnerEmailBlock>,
): Promise<void> => {
  if (block?.created) await recordSignupBlockAdded(block.entry, block.reason);
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
      logger.error(UNDO_FAILED_EVENT, { entryId, error: removed.error });
    }
  } catch (error) {
    logger.error(UNDO_FAILED_EVENT, { entryId, error });
  }
};
