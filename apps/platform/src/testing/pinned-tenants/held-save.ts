import {
  setTenantPinAction,
  type TSetTenantPinActionResult,
} from '@platform/server/tenants/set-tenant-pin-action';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { act } from 'react';

export const holdPinSave = () => {
  const save = Promise.withResolvers<TSetTenantPinActionResult>();
  vi.mocked(setTenantPinAction).mockReturnValueOnce(save.promise);

  const resolveWith = (result: TSetTenantPinActionResult) =>
    act(async () => {
      save.resolve(result);
    });

  return {
    settle: () => resolveWith(toOutcome(ACTION_OUTCOME.SUCCESS)),
    fail: () => resolveWith(toOutcome(ACTION_OUTCOME.SERVER_ERROR)),
  };
};
