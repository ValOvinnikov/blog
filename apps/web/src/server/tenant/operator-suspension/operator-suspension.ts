import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

export const isOperatorSuspended = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.SUSPENDED &&
  tenant.suspensionReason === SUSPENSION_REASON.OPERATOR;
