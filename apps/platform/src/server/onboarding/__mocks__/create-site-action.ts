import { ACTION_OUTCOME } from '@blog/config';
import type { createSiteAction as TCreateSiteAction } from '@platform/server/onboarding/create-site-action';

export const createSiteAction = vi.fn<typeof TCreateSiteAction>(async () => ({
  outcome: ACTION_OUTCOME.SUCCESS,
}));
