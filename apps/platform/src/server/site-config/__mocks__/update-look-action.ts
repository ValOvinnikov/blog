import type { updateLookAction as TUpdateLookAction } from '@platform/server/site-config/update-look-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const updateLookAction = vi.fn<typeof TUpdateLookAction>(async () => ({
  outcome: ACTION_OUTCOME.SUCCESS,
}));
