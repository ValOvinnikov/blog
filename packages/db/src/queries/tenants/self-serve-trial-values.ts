import { TENANT_PLAN } from '@blog/config/constants';
import { DAY_MS, TENANT_STATUS, TRIAL_LENGTH_DAYS } from '@blog/db/constants';

export function selfServeTrialValues(createdAt: Date) {
  return {
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt: new Date(createdAt.getTime() + TRIAL_LENGTH_DAYS * DAY_MS),
    createdAt,
  };
}
