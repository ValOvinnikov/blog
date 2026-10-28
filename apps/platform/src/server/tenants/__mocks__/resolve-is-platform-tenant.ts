import type { TTenant } from '@blog/db/schema/tenants';

export const resolveIsPlatformTenant = vi.fn<
  (tenant: Pick<TTenant, 'id' | 'primaryDomain'>) => Promise<boolean>
>(async () => false);
