import 'server-only';

import { SIGNUP_BLOCK_LOG } from '@platform/constants/signup-block';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import {
  signupBlockAuditDetails,
  type TSignupBlockAuditEntry,
} from '@platform/server/signup-block/signup-block-audit';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TErrorCode,
} from '@shinefold/config';
import { queries, type TBlockedIdentityKind } from '@shinefold/db';
import type { TAddBlockedIdentityOutcome } from '@shinefold/db/queries/blocked-signup-identities/add-blocked-identity';
import type { TAdmin } from '@shinefold/db/schema/admins';
import type { TResult } from '@shinefold/utils';

export type TAddSignupBlockInput = {
  kind: TBlockedIdentityKind;
  identity: string;
  reason: string;
  admin: Pick<TAdmin, 'id'>;
};

export const saveSignupBlock = async ({
  kind,
  identity,
  reason,
  admin,
}: TAddSignupBlockInput): Promise<
  TResult<TAddBlockedIdentityOutcome, TErrorCode>
> =>
  queries.blockedSignupIdentities.addBlockedIdentity({
    kind,
    identity,
    reason,
    createdByAdminId: admin.id,
  });

export const recordSignupBlockAdded = async (
  entry: TSignupBlockAuditEntry,
  reason: string,
  tenantId?: string,
): Promise<void> => {
  const details = { ...signupBlockAuditDetails(entry), reason };
  await recordAuditEvent({
    logEvent: SIGNUP_BLOCK_LOG.ADD_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    targetId: entry.id,
    details: tenantId ? { ...details, tenantId } : details,
  });

  if (!tenantId) return;

  await recordAuditEvent({
    logEvent: SIGNUP_BLOCK_LOG.ADD_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details,
  });
};

export const addSignupBlock = async (
  input: TAddSignupBlockInput,
): Promise<TResult<TAddBlockedIdentityOutcome, TErrorCode>> => {
  const result = await saveSignupBlock(input);
  if (result.ok && result.data.created) {
    await recordSignupBlockAdded(result.data.entry, input.reason);
  }

  return result;
};
