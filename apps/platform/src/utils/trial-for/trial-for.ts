import type { TMaybeUndefined } from '@blog/config';
import { TENANT_STATUS, type TTenantPlan } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

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
