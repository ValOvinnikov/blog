import type { TPinTenantActionResult } from '@platform/server/tenants/pin-tenant-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export const holdSave = () => {
  const save = Promise.withResolvers<TPinTenantActionResult>();

  return {
    promise: save.promise,
    settle: () => save.resolve(toOutcome(ACTION_OUTCOME.SUCCESS)),
  };
};
