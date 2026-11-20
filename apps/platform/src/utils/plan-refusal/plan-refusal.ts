import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import {
  ACTION_OUTCOME,
  isOutcomeRefused,
  type TActionOutcome,
  type TOutcome,
} from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';

export type TNotInPlanRefusal = {
  outcome: typeof ACTION_OUTCOME.REFUSED;
  reason: typeof SETTINGS_REFUSAL.NOT_IN_PLAN;
  values: { plan: TTenantPlan; localeLimit?: number };
  items: string[];
};

export const toNotInPlanRefusal = (
  plan: TTenantPlan,
  items: string[],
  localeLimit?: number,
): TNotInPlanRefusal => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
  values: { plan, localeLimit },
  items,
});

export const isNotInPlanRefusal = (
  result: TOutcome<TActionOutcome> | TNotInPlanRefusal,
): result is TNotInPlanRefusal =>
  isOutcomeRefused(result) &&
  'reason' in result &&
  result.reason === SETTINGS_REFUSAL.NOT_IN_PLAN;
