'use server';

import { BILLING_LOG } from '@platform/constants/billing';
import type { TPlanChangeRefusal } from '@platform/constants/plan-change';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import type { TStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { planTotalFor } from '@platform/utils/move-up-offer/move-up-offer';
import { isOutcomeRefused, type TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

import { moveUpBandSchema, type TMoveUpBandInput } from './move-up-band-input';
import { previewMoveUp, type TMoveUpPreview } from './preview-move-up';
import { readChangeableSubscription } from './read-changeable-subscription';
import { resolveMoveUpPrices } from './resolve-move-up-prices';

export type TMoveUpQuote = TMoveUpPreview & {
  renewsAt: Date;
  total: TStripeAmount;
};

export type TMoveUpQuoteResult = TResult<
  TMoveUpQuote,
  TMaybeUndefined<TPlanChangeRefusal>
>;

export const getMoveUpQuoteAction = async (
  tenantId: string,
  input: TMoveUpBandInput,
): Promise<TMoveUpQuoteResult> => {
  const membership = await requireTenantMembership(tenantId);
  const parsed = moveUpBandSchema.safeParse(input);
  const { billingCurrency: currency } = membership.tenant;
  if (!parsed.success || !currency) return errorResult(undefined);
  const { ceiling } = parsed.data;

  try {
    const read = await readChangeableSubscription(membership);
    if (!read.ok) {
      const { error } = read;
      return errorResult(isOutcomeRefused(error) ? error.reason : undefined);
    }
    const prices = await resolveMoveUpPrices(tenantId, read.data, ceiling);
    if (!prices.ok) return errorResult(prices.error);

    const { subscription } = read.data;
    const pricing = { ...subscription.current, currency };
    const [preview, catalogue] = await Promise.all([
      previewMoveUp(read.data.stripe, subscription, prices.data),
      queries.stripeCatalogue.listStripePrices(),
    ]);
    const total = planTotalFor(catalogue, pricing, ceiling);
    if (!total) {
      logger.error(BILLING_LOG.PLAN_CHANGE_PRICE_MISSING, {
        tenantId,
        ceiling,
      });
      return errorResult(undefined);
    }
    return okResult({ ...preview, renewsAt: subscription.renewsAt, total });
  } catch (error) {
    logger.error(BILLING_LOG.MOVE_UP_QUOTE_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return errorResult(undefined);
  }
};
