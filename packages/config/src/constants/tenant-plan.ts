import type { TValueOf } from '@blog/config/utils';

export const TENANT_PLAN = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
} as const;

export type TTenantPlan = TValueOf<typeof TENANT_PLAN>;

export const SELLABLE_TENANT_PLANS = [
  TENANT_PLAN.STARTER,
  TENANT_PLAN.GROWTH,
] as const satisfies readonly TTenantPlan[];

export type TSellableTenantPlan = (typeof SELLABLE_TENANT_PLANS)[number];
