'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
  type TAuditAction,
  type TMaybeUndefined,
} from '@blog/config';
import {
  SUSPENSION_CATEGORY,
  TENANT_STATUS,
  type TSuspensionStatus,
} from '@blog/db';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import type { TTenant } from '@blog/db/schema/tenants';
import { toOutcome } from '@blog/utils/to-outcome';
import { type TENANT_REFUSAL, TENANT_LOG } from '@platform/constants/tenant';
import { SUSPENSION_DESCRIPTION_MAX_LENGTH } from '@platform/constants/tenant-suspension';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TTenantLifecycleResult } from '@platform/server/provisioning/tenant-lifecycle-result';
import { signupBlockReasonSchema } from '@platform/server/signup-block/signup-block-reason-schema';
import { notifyOwnerOfSuspension } from '@platform/server/tenants/notify-owner-of-suspension';
import { resolveSuspendableTenant } from '@platform/server/tenants/resolve-suspendable-tenant';
import type { TSuspensionCase } from '@platform/server/tenants/tenant-suspension-case';
import {
  applyTenantSuspension,
  liftTenantSuspension,
} from '@platform/server/tenants/tenant-suspension-writes';
import { after } from 'next/server';
import { z } from 'zod';

export type TTenantSuspensionResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN
  | typeof TENANT_REFUSAL.PLATFORM_TENANT
>;

export type { TSuspensionCase };

export type TOwnerEmailBlock = { reason: string };

const suspensionCaseSchema = z.object({
  category: z.enum(SUSPENSION_CATEGORY),
  description: z.string().trim().min(1).max(SUSPENSION_DESCRIPTION_MAX_LENGTH),
});

const ownerEmailBlockSchema = z.object({ reason: signupBlockReasonSchema });

const SUSPENSION_AUDIT_ACTION = {
  [TENANT_STATUS.SUSPENDED]: AUDIT_ACTION.SUSPENSION_APPLIED,
  [TENANT_STATUS.ACTIVE]: AUDIT_ACTION.SUSPENSION_LIFTED,
} as const satisfies Record<TSuspensionStatus, TAuditAction>;

const completeSuspensionChange = async (
  tenant: TTenant,
  status: TSuspensionStatus,
  suspension: TMaybeUndefined<TTenantSuspension>,
): Promise<TTenantSuspensionResult> => {
  await recordAuditEvent({
    logEvent: TENANT_LOG.SUSPENSION_AUDIT_FAILED,
    action: SUSPENSION_AUDIT_ACTION[status],
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenant.id,
    details: {
      name: tenant.name,
      ...(suspension && {
        reference: suspension.reference,
        category: suspension.category,
      }),
    },
  });

  if (suspension) {
    after(() => notifyOwnerOfSuspension(tenant, suspension, status));
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};

export const suspendTenantAction = async (
  tenantId: string,
  suspensionCase: TSuspensionCase,
  ownerEmailBlock?: TOwnerEmailBlock,
): Promise<TTenantSuspensionResult> => {
  const admin = await requireSuperAdmin();

  const parsedCase = suspensionCaseSchema.safeParse(suspensionCase);
  const parsedBlock = ownerEmailBlock
    ? ownerEmailBlockSchema.safeParse(ownerEmailBlock)
    : undefined;
  if (!parsedCase.success || (parsedBlock && !parsedBlock.success)) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const resolved = await resolveSuspendableTenant(
    tenantId,
    TENANT_STATUS.SUSPENDED,
  );
  if (!isOutcomeSuccess(resolved)) return resolved;

  const applied = await applyTenantSuspension(
    admin,
    tenantId,
    parsedCase.data,
    parsedBlock?.data.reason,
  );
  if (!applied.ok) return applied.error;

  return completeSuspensionChange(
    resolved.tenant,
    TENANT_STATUS.SUSPENDED,
    applied.data,
  );
};

export const liftTenantSuspensionAction = async (
  tenantId: string,
): Promise<TTenantSuspensionResult> => {
  const admin = await requireSuperAdmin();

  const resolved = await resolveSuspendableTenant(
    tenantId,
    TENANT_STATUS.ACTIVE,
  );
  if (!isOutcomeSuccess(resolved)) return resolved;

  const lifted = await liftTenantSuspension(admin, tenantId);
  if (!lifted.ok) return lifted.error;

  return completeSuspensionChange(
    resolved.tenant,
    TENANT_STATUS.ACTIVE,
    lifted.data,
  );
};
