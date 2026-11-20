import { PLAN_CHANGE_TIMING } from '@platform/constants/plan-change';
import type { TChangePlanResult } from '@platform/server/billing/plan-change-outcome';
import { ACTION_OUTCOME } from '@shinefold/config';

export const moveUpSubscriberBandAction = vi.fn(
  async (): Promise<TChangePlanResult> => ({
    outcome: ACTION_OUTCOME.SUCCESS,
    timing: PLAN_CHANGE_TIMING.NOW,
  }),
);
