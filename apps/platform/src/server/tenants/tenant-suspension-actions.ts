'use server';

import type { TENANT_REFUSAL } from '@platform/constants/tenant';
import { SUSPENSION_DESCRIPTION_MAX_LENGTH } from '@platform/constants/tenant-suspension';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TTenantLifecycleResult } from '@platform/server/provisioning/tenant-lifecycle-result';
import { signupBlockReasonSchema } from '@platform/server/signup-block/signup-block-reason-schema';
import { completeSuspensionChange } from '@platform/server/tenants/complete-suspension-change';
import { liftTenantSuspension } from '@platform/server/tenants/lift-tenant-suspension';
import { resolveSuspendableTenant } from '@platform/server/tenants/resolve-suspendable-tenant';
import type { TSuspensionCase } from '@platform/server/tenants/tenant-suspension-case';
import { applyTenantSuspension } from '@platform/server/tenants/tenant-suspension-writes';
import { ACTION_OUTCOME, isOutcomeSuccess } from '@shinefold/config';
import { SUSPENSION_CATEGORY, TENANT_STATUS } from '@shinefold/db';
import { z } from 'zod';

export type TTenantSuspensionResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.NOT_SUSPENDED
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
