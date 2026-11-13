import {
  TENANT_PLAN,
  TENANT_STATUS,
  TRIAL_LENGTH_DAYS,
} from '@blog/db/constants';
import { daysAfter } from '@blog/db/utils/day-offset/day-offset';

export function selfServeTrialValues(createdAt: Date) {
  return {
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt: daysAfter(createdAt, TRIAL_LENGTH_DAYS),
    createdAt,
  };
}
