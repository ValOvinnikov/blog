import type { resolveLiveTenant as TResolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';

export const resolveLiveTenant = vi.fn<typeof TResolveLiveTenant>();
