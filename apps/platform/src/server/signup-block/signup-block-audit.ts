import 'server-only';

import { SIGNUP_BLOCK_LOG } from '@platform/constants/signup-block';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TMaybeUndefined,
} from '@shinefold/config';
import { BLOCKED_IDENTITY_KIND, queries } from '@shinefold/db';
import type { TBlockedSignupIdentity } from '@shinefold/db/schema/blocked-signup-identities';
import { z } from 'zod';

export type TSignupBlockAuditEntry = Pick<
  TBlockedSignupIdentity,
  'kind' | 'value' | 'id'
>;

const blockTenantDetailsSchema = z.object({ tenantId: z.string().min(1) });

export const signupBlockAuditDetails = ({
  kind,
  value,
}: Pick<TSignupBlockAuditEntry, 'kind' | 'value'>) => ({
  kind,
  ...(kind === BLOCKED_IDENTITY_KIND.DOMAIN && { domain: value }),
});

const findBlockTenantId = async (
  entryId: string,
): Promise<TMaybeUndefined<string>> => {
  try {
    const events = await queries.auditEvents.listAuditEventsForTarget(
      AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      entryId,
    );
    const added = events.find(
      ({ action }) => action === AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    );

    return blockTenantDetailsSchema.safeParse(added?.details).data?.tenantId;
  } catch (error) {
    logger.error(SIGNUP_BLOCK_LOG.REMOVE_AUDIT_FAILED, {
      entryId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};

export const recordSignupBlockRemoved = async (
  entry: TSignupBlockAuditEntry,
): Promise<void> => {
  const details = signupBlockAuditDetails(entry);
  await recordAuditEvent({
    logEvent: SIGNUP_BLOCK_LOG.REMOVE_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
    targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    targetId: entry.id,
    details,
  });

  const tenantId = await findBlockTenantId(entry.id);
  if (!tenantId) return;

  await recordAuditEvent({
    logEvent: SIGNUP_BLOCK_LOG.REMOVE_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details,
  });
};
