import type { TAdmin } from '@blog/db/schema/admins';

export const requireTenantOwnerOrAdmin = vi.fn<
  (
    tenantId: string,
    isAdminPermitted?: (admin: TAdmin) => boolean,
  ) => Promise<void>
>(async () => undefined);
