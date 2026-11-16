import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TTrial = {
  plan: TTenantPlan;
  endsAt: Date;
  hasEnded: boolean;
};

export const trialFor = (
  { status, plan, trialEndsAt }: TTenant,
  now: Date = new Date(),
): TMaybeUndefined<TTrial> => {
  if (status !== TENANT_STATUS.TRIAL || !trialEndsAt) return undefined;

  return {
    plan,
    endsAt: trialEndsAt,
    hasEnded: trialEndsAt.getTime() <= now.getTime(),
  };
};
