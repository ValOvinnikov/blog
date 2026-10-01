import type * as TModule from '@web/server/tenant/get-tenant-sanity-context';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

export const getTenantSanityContext = vi.fn<
  typeof TModule.getTenantSanityContext
>(async () => DEFAULT_TENANT_SANITY_CONTEXT);
