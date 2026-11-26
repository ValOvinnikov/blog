import type { TPinTenantActionResult } from '@platform/server/tenants/pin-tenant-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export const pinTenantAction = vi.fn<
  (tenantId: string) => Promise<TPinTenantActionResult>
>(async () => toOutcome(ACTION_OUTCOME.SUCCESS));
