import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';

export const getTenantPlanAction = vi.fn(
  async (): Promise<TTenantPlan> => TENANT_PLAN.STARTER,
);
