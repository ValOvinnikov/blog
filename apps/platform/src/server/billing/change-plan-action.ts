'use server';

import {
  ACTION_OUTCOME,
  type TActionResult,
  type TOutcome,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeRefusal,
  type TPlanChangeTiming,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import Stripe from 'stripe';

import { changeSubscriptionPlan } from './change-subscription-plan';
import { readTenantSubscriptionPlan } from './read-tenant-subscription-plan';
import { planChoiceSchema } from './upgrade-checkout-input';
import { planChangeRefusalFor } from './upgrade-state-for';

export type TChangePlanResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; timing: TPlanChangeTiming }
  | Exclude<
      TActionResult<
        typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
        keyof TPlanChoice,
        never,
        TPlanChangeRefusal
      >,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >;

const refused = (reason: TPlanChangeRefusal): TChangePlanResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const changePlanAction = async (
  tenantId: string,
  input: TPlanChoice,
): Promise<TChangePlanResult> => {
  const { tenant, membership } = await requireTenantMembership(tenantId);

  const parsed = planChoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const gate = planChangeRefusalFor(tenant, membership);
  if (gate) return refused(gate);

  const { stripeSubscriptionId } = tenant;
  const read =
    stripeSubscriptionId &&
    (await readTenantSubscriptionPlan(tenantId, stripeSubscriptionId));
  if (!read) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  const { stripe, subscription } = read;
  if (!subscription.isChangeable) {
    return refused(PLAN_CHANGE_REFUSAL.NOT_ACTIVE);
  }

  try {
    const result = await changeSubscriptionPlan(
      stripe,
      subscription,
      parsed.data,
      tenantId,
    );
    if (!result) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    if (result === PLAN_CHANGE_REFUSAL.UNCHANGED) return refused(result);
    return { outcome: ACTION_OUTCOME.SUCCESS, timing: result };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      return refused(PLAN_CHANGE_REFUSAL.CARD_DECLINED);
    }
    logger.error(BILLING_LOG.PLAN_CHANGE_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
