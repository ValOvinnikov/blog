import { TENANT_PLAN } from '@shinefold/config/constants';
import type * as TModule from '@web/server/site-config/get-effective-plan/get-effective-plan';

export const getEffectivePlan = vi.fn<typeof TModule.getEffectivePlan>(
  async () => TENANT_PLAN.GROWTH,
);
