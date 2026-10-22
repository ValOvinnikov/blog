import 'server-only';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, type TErrorCode } from '@blog/config';
import {
  BLOCKED_IDENTITY_KIND,
  queries,
  type TBlockedIdentityKind,
} from '@blog/db';
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

const CREATED_BY_THIS_CALL_WINDOW_MS = 60_000;

const wasCreatedByThisCall = (
  entry: TBlockedSignupIdentity,
  { reason, admin }: Pick<TAddSignupBlockInput, 'reason' | 'admin'>,
  now: Date,
): boolean =>
  entry.reason === reason &&
  entry.createdByAdminId === admin.id &&
  Math.abs(now.getTime() - entry.createdAt.getTime()) <=
    CREATED_BY_THIS_CALL_WINDOW_MS;

export const addSignupBlock = async ({
  kind,
  identity,
  reason,
  admin,
}: TAddSignupBlockInput): Promise<
  TResult<TBlockedSignupIdentity, TErrorCode>
> => {
  const requestedAt = new Date();
  const result = await queries.blockedSignupIdentities.addBlockedIdentity({
    kind,
    identity,
    reason,
    createdByAdminId: admin.id,
  });
  if (!result.ok) return result;

  if (!wasCreatedByThisCall(result.data, { reason, admin }, requestedAt)) {
    return result;
  }

  const { id, value } = result.data;
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

  return result;
};
