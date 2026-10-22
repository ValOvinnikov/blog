import 'server-only';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, type TErrorCode } from '@blog/config';
import {
  BLOCKED_IDENTITY_KIND,
  queries,
  type TBlockedIdentityKind,
} from '@blog/db';
import type { TAddBlockedIdentityOutcome } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TBlockedSignupIdentity } from '@blog/db/schema/blocked-signup-identities';
import type { TResult } from '@blog/utils';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';

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
  { kind, value, id }: Pick<TBlockedSignupIdentity, 'kind' | 'value' | 'id'>,
  reason: string,
): Promise<void> => {
  await recordAuditEvent({
    logEvent: 'signup_block.add_audit_failed',
    action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    targetId: id,
    details: {
      kind,
      reason,
      ...(kind === BLOCKED_IDENTITY_KIND.DOMAIN && { domain: value }),
    },
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
