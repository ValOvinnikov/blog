import {
  ACTION_OUTCOME,
  isOutcomeRefused,
  type TActionOutcome,
  type TOutcome,
} from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';

export type TNotInPlanRefusal = {
  outcome: typeof ACTION_OUTCOME.REFUSED;
  reason: typeof SETTINGS_REFUSAL.NOT_IN_PLAN;
  values: { plan: TTenantPlan };
  items: string[];
};

export const toNotInPlanRefusal = (
  plan: TTenantPlan,
  items: string[],
): TNotInPlanRefusal => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
  values: { plan },
  items,
});

export const isNotInPlanRefusal = (
  result: TOutcome<TActionOutcome> | TNotInPlanRefusal,
): result is TNotInPlanRefusal =>
  isOutcomeRefused(result) &&
  'reason' in result &&
  result.reason === SETTINGS_REFUSAL.NOT_IN_PLAN;
