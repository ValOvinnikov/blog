import { ACTION_OUTCOME } from '@blog/config';
import type { updateLookAction as TUpdateLookAction } from '@platform/server/site-config/update-look-action';

export const updateLookAction = vi.fn<typeof TUpdateLookAction>(async () => ({
  outcome: ACTION_OUTCOME.SUCCESS,
}));
