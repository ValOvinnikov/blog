import type { createSiteAction as TCreateSiteAction } from '@platform/server/onboarding/create-site-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const createSiteAction = vi.fn<typeof TCreateSiteAction>(async () => ({
  outcome: ACTION_OUTCOME.SUCCESS,
}));
