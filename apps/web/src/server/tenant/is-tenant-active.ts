import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

export const isTenantActive = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.ACTIVE && !tenant.deprovisionedAt;
