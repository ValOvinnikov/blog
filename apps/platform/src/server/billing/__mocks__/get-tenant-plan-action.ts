import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';

export const getTenantPlanAction = vi.fn(
  async (): Promise<TTenantPlan> => TENANT_PLAN.STARTER,
);
