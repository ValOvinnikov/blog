import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';
import { queries, SUSPENSION_REASON, TENANT_STATUS } from '@shinefold/db';
import type { TOpenTenantSuspension } from '@shinefold/db/queries/tenant-suspensions';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const loadOperatorSuspension = async ({
  id,
  status,
  suspensionReason,
}: Pick<TTenant, 'id' | 'status' | 'suspensionReason'>): Promise<
  TMaybeUndefined<TOpenTenantSuspension>
> =>
  status === TENANT_STATUS.SUSPENDED &&
  suspensionReason === SUSPENSION_REASON.OPERATOR
    ? queries.tenantSuspensions.getOpenTenantSuspension(id)
    : undefined;
