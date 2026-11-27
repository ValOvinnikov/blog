import type { deleteTenantAction as TAction } from '@platform/server/provisioning/delete-tenant-action';

export const deleteTenantAction = vi.fn<typeof TAction>();
