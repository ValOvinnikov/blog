import type * as TModule from '@web/server/site-config/get-brand-name/get-brand-name';
import { MOCK_TENANT_NAME } from '@web/testing/shared/tenant/fixtures';

export const getBrandName = vi.fn<typeof TModule.getBrandName>(
  async () => MOCK_TENANT_NAME,
);
