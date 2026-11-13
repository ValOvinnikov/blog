import { ACTION_OUTCOME } from '@blog/config';
import { PLAN_CHANGE_TIMING } from '@platform/constants/plan-change';
import type { TChangePlanResult } from '@platform/server/billing/change-plan-action';

export const changePlanAction = vi.fn(async (): Promise<TChangePlanResult> => ({
  outcome: ACTION_OUTCOME.SUCCESS,
  timing: PLAN_CHANGE_TIMING.NOW,
}));
