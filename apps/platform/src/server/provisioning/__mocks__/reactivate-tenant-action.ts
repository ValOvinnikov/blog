import type { reactivateTenantAction as TAction } from '@platform/server/provisioning/reactivate-tenant-action';

export const reactivateTenantAction = vi.fn<typeof TAction>();
