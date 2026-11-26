import type { TSetTenantPinActionResult } from '@platform/server/tenants/set-tenant-pin-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export const holdSave = () => {
  const save = Promise.withResolvers<TSetTenantPinActionResult>();

  return {
    promise: save.promise,
    settle: () => save.resolve(toOutcome(ACTION_OUTCOME.SUCCESS)),
  };
};
