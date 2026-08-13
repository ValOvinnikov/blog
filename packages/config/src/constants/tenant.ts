import type { TValueOf } from '@blog/config/utils';

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type TTenantStatus = TValueOf<typeof TENANT_STATUS>;

export const TENANT_PLAN = {
  FREE: 'FREE',
  GROWTH: 'GROWTH',
} as const;

export type TTenantPlan = TValueOf<typeof TENANT_PLAN>;
