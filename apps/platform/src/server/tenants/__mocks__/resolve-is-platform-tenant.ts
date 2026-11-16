import type { TTenant } from '@shinefold/db/schema/tenants';

export const resolveIsPlatformTenant = vi.fn<
  (tenant: Pick<TTenant, 'id' | 'primaryDomain'>) => Promise<boolean>
>(async () => false);
