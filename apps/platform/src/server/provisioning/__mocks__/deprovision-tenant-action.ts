import type { deprovisionTenantAction as TAction } from '@platform/server/provisioning/deprovision-tenant-action';

export const deprovisionTenantAction = vi.fn<typeof TAction>();
