import {
  ACTION_OUTCOME,
  type TFieldErrors,
  type TMaybeUndefined,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  type TTenantRefusal,
} from '@platform/constants/tenant';
import { getPlatformTenant } from '@platform/server/tenants/get-platform-tenant';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { z } from 'zod';

export const confirmTenantInputSchema = z.object({
  confirm: z.string().trim().min(1),
});

export type TConfirmTenantField = keyof z.input<
  typeof confirmTenantInputSchema
>;

export type TConfirmTenantFieldError =
  | typeof TENANT_FIELD_ERROR.CONFIRM_REQUIRED
  | typeof TENANT_FIELD_ERROR.NAME_MISMATCH;

type TResolveConfirmedTenantOptions<
  TPreconditionRefusal extends TTenantRefusal,
> = {
  precondition?: (
    tenant: TPlatformTenant,
  ) => TMaybeUndefined<TPreconditionRefusal>;
};

export type TResolveConfirmedTenantResult<
  TPreconditionRefusal extends TTenantRefusal,
> =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; tenant: TPlatformTenant }
  | {
      outcome: typeof ACTION_OUTCOME.INVALID;
      fieldErrors: TFieldErrors<TConfirmTenantField, TConfirmTenantFieldError>;
    }
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof TENANT_REFUSAL.NOT_FOUND | TPreconditionRefusal>);

export const resolveConfirmedTenant = async <
  TPreconditionRefusal extends TTenantRefusal = never,
>(
  tenantId: string,
  confirm: string,
  { precondition }: TResolveConfirmedTenantOptions<TPreconditionRefusal> = {},
): Promise<TResolveConfirmedTenantResult<TPreconditionRefusal>> => {
  const tenant = await getPlatformTenant(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }

  const preconditionRefusal = precondition?.(tenant);
  if (preconditionRefusal) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: preconditionRefusal };
  }

  if (confirm !== tenant.name) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    };
  }

  return { outcome: ACTION_OUTCOME.SUCCESS, tenant };
};
