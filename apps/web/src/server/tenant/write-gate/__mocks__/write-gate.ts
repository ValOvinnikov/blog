import { okResult } from '@blog/utils';
import type * as TModule from '@web/server/tenant/write-gate/write-gate';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const isTenantActive = vi.fn<typeof TModule.isTenantActive>(() => true);

export const isRequestTenantActive = vi.fn<
  typeof TModule.isRequestTenantActive
>(async () => true);

export const resolveWritableTenant = vi.fn<
  typeof TModule.resolveWritableTenant
>(async () => okResult(MOCK_TENANT_ID));
