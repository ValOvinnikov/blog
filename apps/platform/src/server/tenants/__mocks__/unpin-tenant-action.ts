import type { TUnpinTenantActionResult } from '@platform/server/tenants/unpin-tenant-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export const unpinTenantAction = vi.fn<
  (tenantId: string) => Promise<TUnpinTenantActionResult>
>(async () => toOutcome(ACTION_OUTCOME.SUCCESS));
