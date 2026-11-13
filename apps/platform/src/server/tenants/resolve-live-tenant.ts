import 'server-only';

import {
  ACTION_OUTCOME,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getPlatformTenant } from '@platform/server/tenants/get-platform-tenant';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TResolveLiveTenantResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; tenant: TPlatformTenant }
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<
        typeof TENANT_REFUSAL.NOT_FOUND | typeof TENANT_REFUSAL.ARCHIVED
      >);

export const resolveLiveTenant = async (
  tenantId: string,
): Promise<TResolveLiveTenantResult> => {
  const tenant = await getPlatformTenant(tenantId, { includeArchived: true });

  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (tenant.isArchived) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED };
  }

  return { outcome: ACTION_OUTCOME.SUCCESS, tenant };
};
