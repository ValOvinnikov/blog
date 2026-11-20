import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeRefusalCode,
} from '@platform/constants/plan-change';
import { logger } from '@platform/utils/logger/logger';
import { nextSubscriberBand } from '@platform/utils/next-subscriber-band/next-subscriber-band';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TPaidSubscriberBandCeiling } from '@shinefold/db/constants';
import { bandKeyFor } from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

import { findTargetPrices } from './find-target-prices';
import type { TTenantSubscriptionPlan } from './read-tenant-subscription-plan';
import type { TTargetPrices } from './schedule-change-at-renewal';

export const resolveMoveUpPrices = async (
  tenantId: string,
  { stripe, subscription }: TTenantSubscriptionPlan,
  ceiling: TPaidSubscriberBandCeiling,
): Promise<TResult<TTargetPrices, TMaybeUndefined<TPlanChangeRefusalCode>>> => {
  const { current, pending } = subscription;
  const isNextBand =
    nextSubscriberBand(current.ceiling) === ceiling &&
    Boolean(bandKeyFor(current.plan, current.interval, ceiling));
  if (!isNextBand) {
    return errorResult(PLAN_CHANGE_REFUSAL.NO_NEXT_BAND);
  }
  if (pending) {
    return errorResult(PLAN_CHANGE_REFUSAL.PENDING_CHANGE);
  }

  const prices = await findTargetPrices(stripe, current, ceiling);
  if (!prices?.band) {
    logger.error(BILLING_LOG.PLAN_CHANGE_PRICE_MISSING, {
      tenantId,
      ...current,
      ceiling,
    });
    return errorResult(undefined);
  }
  return okResult(prices);
};
