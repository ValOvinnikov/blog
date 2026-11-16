import { TENANT_PLAN } from '@shinefold/config/constants';
import { okResult } from '@shinefold/utils';
import type * as TModule from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';

export const getTenantPlan = vi.fn<typeof TModule.getTenantPlan>(async () =>
  okResult(TENANT_PLAN.GROWTH),
);
