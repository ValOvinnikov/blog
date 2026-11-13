import type { TValueOf } from '@blog/config/utils';

export const TENANT_PLAN = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
} as const;

export type TTenantPlan = TValueOf<typeof TENANT_PLAN>;
