import type { setTenantPinAction as TSetTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export const setTenantPinAction = vi.fn<typeof TSetTenantPinAction>(async () =>
  toOutcome(ACTION_OUTCOME.SUCCESS),
);
