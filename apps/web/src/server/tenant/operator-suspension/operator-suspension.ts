import { SUSPENSION_REASON, TENANT_STATUS } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const isOperatorSuspended = (tenant: TTenant): boolean =>
  tenant.status === TENANT_STATUS.SUSPENDED &&
  tenant.suspensionReason === SUSPENSION_REASON.OPERATOR;
