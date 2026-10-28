'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
  type TAuditAction,
  type TMaybeUndefined,
} from '@blog/config';
import { queries, TENANT_STATUS, type TSuspensionStatus } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_REFUSAL, TENANT_LOG } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TTenantLifecycleResult } from '@platform/server/provisioning/tenant-lifecycle-result';
import { signupBlockReasonSchema } from '@platform/server/signup-block/signup-block-reason-schema';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  blockTenantOwnerEmail,
  confirmOwnerEmailBlock,
  type TSavedOwnerEmailBlock,
  undoOwnerEmailBlock,
} from '@platform/server/tenants/block-tenant-owner-email';
import { resolveSuspendableTenant } from '@platform/server/tenants/resolve-suspendable-tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

export type TTenantSuspensionResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN
  | typeof TENANT_REFUSAL.PLATFORM_TENANT
>;

export type TOwnerEmailBlock = { reason: string };

const ownerEmailBlockSchema = z.object({ reason: signupBlockReasonSchema });

const SUSPENSION_AUDIT_ACTION = {
  [TENANT_STATUS.SUSPENDED]: AUDIT_ACTION.SUSPENSION_APPLIED,
  [TENANT_STATUS.ACTIVE]: AUDIT_ACTION.SUSPENSION_LIFTED,
} as const satisfies Record<TSuspensionStatus, TAuditAction>;

const setSuspension = async (
  tenantId: string,
  status: TSuspensionStatus,
  ownerEmailBlock: TMaybeUndefined<TOwnerEmailBlock> = undefined,
): Promise<TTenantSuspensionResult> => {
  const admin = await requireSuperAdmin();

  const parsedBlock = ownerEmailBlock
    ? ownerEmailBlockSchema.safeParse(ownerEmailBlock)
    : undefined;
  if (parsedBlock && !parsedBlock.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const resolved = await resolveSuspendableTenant(tenantId, status);
  if (!isOutcomeSuccess(resolved)) return resolved;
  const { tenant } = resolved;

  let ownerBlock: TMaybeUndefined<TSavedOwnerEmailBlock>;
  let isSuspensionSaved = false;
  try {
    if (parsedBlock) {
      const blocked = await blockTenantOwnerEmail(
        admin,
        tenantId,
        parsedBlock.data.reason,
      );
      if (!blocked.ok) return blocked.error;
      ownerBlock = blocked.data;
    }

    const updated = await queries.tenants.setTenantSuspension(tenantId, status);
    if (!updated.ok) {
      await undoOwnerEmailBlock(ownerBlock);
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ARCHIVED,
      };
    }
    isSuspensionSaved = true;
    await confirmOwnerEmailBlock(ownerBlock);
    await revalidateSiteConfig(tenantId);
  } catch (error) {
    logger.error(TENANT_LOG.SUSPENSION_SAVE_FAILED, {
      tenantId,
      status,
      ...toLoggableError(error),
    });
    if (!isSuspensionSaved) await undoOwnerEmailBlock(ownerBlock);
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  await recordAuditEvent({
    logEvent: TENANT_LOG.SUSPENSION_AUDIT_FAILED,
    action: SUSPENSION_AUDIT_ACTION[status],
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};

export const suspendTenantAction = async (
  tenantId: string,
  ownerEmailBlock?: TOwnerEmailBlock,
): Promise<TTenantSuspensionResult> =>
  setSuspension(tenantId, TENANT_STATUS.SUSPENDED, ownerEmailBlock);

export const liftTenantSuspensionAction = async (
  tenantId: string,
): Promise<TTenantSuspensionResult> =>
  setSuspension(tenantId, TENANT_STATUS.ACTIVE);
