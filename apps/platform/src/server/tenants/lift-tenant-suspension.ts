import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import { errorResult, okResult } from '@blog/utils';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { reopenTenantSuspensionCase } from '@platform/server/tenants/tenant-suspension-case';
import {
  ARCHIVED_REFUSAL,
  failWrite,
  type TSuspensionWrite,
} from '@platform/server/tenants/tenant-suspension-writes';

export const liftTenantSuspension = async (
  admin: TAdmin,
  tenantId: string,
): TSuspensionWrite<TMaybeUndefined<TTenantSuspension>> => {
  let closedCase: TMaybeUndefined<TTenantSuspension>;
  let isLiftSaved = false;
  try {
    closedCase = await queries.tenantSuspensions.closeTenantSuspension(
      tenantId,
      admin.id,
    );
    const updated = await queries.tenants.setTenantSuspension(
      tenantId,
      TENANT_STATUS.ACTIVE,
    );
    if (!updated.ok) {
      await reopenTenantSuspensionCase(closedCase);
      return errorResult(ARCHIVED_REFUSAL);
    }
    isLiftSaved = true;
    await revalidateSiteConfig(tenantId);
    return okResult(closedCase);
  } catch (error) {
    if (!isLiftSaved) await reopenTenantSuspensionCase(closedCase);
    return failWrite(tenantId, TENANT_STATUS.ACTIVE, error);
  }
};
