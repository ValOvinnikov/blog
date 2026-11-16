import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS, TRIAL_LENGTH_DAYS } from '@shinefold/db/constants';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';

export function selfServeTrialValues(createdAt: Date) {
  return {
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt: daysAfter(createdAt, TRIAL_LENGTH_DAYS),
    createdAt,
  };
}
