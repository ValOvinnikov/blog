import 'server-only';

import { SIGNUP_BLOCK_LOG } from '@platform/constants/signup-block';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TAuditAction,
  type TMaybeUndefined,
} from '@shinefold/config';
import { BLOCKED_IDENTITY_KIND, queries } from '@shinefold/db';
import type { TBlockedSignupIdentity } from '@shinefold/db/schema/blocked-signup-identities';
import { z } from 'zod';

type TSignupBlockAuditEntry = Pick<
  TBlockedSignupIdentity,
  'kind' | 'value' | 'id'
>;

type TBlockAuditEvent = {
  logEvent: string;
  action: TAuditAction;
  entry: TSignupBlockAuditEntry;
  details: Record<string, unknown>;
  tenantId: TMaybeUndefined<string>;
};

const blockTenantDetailsSchema = z.object({ tenantId: z.string().min(1) });

const signupBlockAuditDetails = ({ kind, value }: TSignupBlockAuditEntry) => ({
  kind,
  ...(kind === BLOCKED_IDENTITY_KIND.DOMAIN && { domain: value }),
});

// A later removal finds the tenant from the identity-targeted event's `tenantId`.
const recordOnBlockAndTenant = async ({
  logEvent,
  action,
  entry,
  details,
  tenantId,
}: TBlockAuditEvent): Promise<void> => {
  await recordAuditEvent({
    logEvent,
    action,
    targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    targetId: entry.id,
    details: tenantId ? { ...details, tenantId } : details,
  });

  if (!tenantId) return;

  await recordAuditEvent({
    logEvent,
    action,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details,
  });
};

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

export const recordSignupBlockAdded = async (
  entry: TSignupBlockAuditEntry,
  reason: string,
  tenantId?: string,
): Promise<void> => {
  await recordOnBlockAndTenant({
    logEvent: SIGNUP_BLOCK_LOG.ADD_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    entry,
    details: { ...signupBlockAuditDetails(entry), reason },
    tenantId,
  });
};

export const recordSignupBlockRemoved = async (
  entry: TSignupBlockAuditEntry,
): Promise<void> => {
  await recordOnBlockAndTenant({
    logEvent: SIGNUP_BLOCK_LOG.REMOVE_AUDIT_FAILED,
    action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
    entry,
    details: signupBlockAuditDetails(entry),
    tenantId: await findBlockTenantId(entry.id),
  });
};
