'use server';

import {
  ACTION_OUTCOME,
  type TActionResult,
  type TOutcome,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  BILLING_LOG,
  STRIPE_CHECKOUT_SESSION_ID_TEMPLATE,
  type TUpgradeRefusal,
  UPGRADE_PAYMENT,
  UPGRADE_SEARCH_PARAM,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { createPlanCheckoutSession } from './create-plan-checkout-session';
import { ensureStripeCustomer } from './ensure-stripe-customer';
import {
  expireOpenCheckouts,
  hasLiveSubscription,
} from './prepare-customer-checkout';
import { getStripeClient } from './stripe-client';
import {
  type TUpgradeCheckoutInput,
  upgradeCheckoutInputSchema,
} from './upgrade-checkout-input';
import { upgradeStateFor } from './upgrade-state-for';

export type TCreateUpgradeCheckoutResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; clientSecret: string }
  | Exclude<
      TActionResult<
        typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
        keyof TUpgradeCheckoutInput,
        never,
        TUpgradeRefusal
      >,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >;

const toReturnUrl = (baseUrl: string): string =>
  `${new URL(adminRoutes.dashboardUpgrade(), baseUrl)}?${UPGRADE_SEARCH_PARAM.SESSION_ID}=${STRIPE_CHECKOUT_SESSION_ID_TEMPLATE}`;

export const createUpgradeCheckoutAction = async (
  tenantId: string,
  input: TUpgradeCheckoutInput,
): Promise<TCreateUpgradeCheckoutResult> => {
  const { tenant, viewer } = await requireTenantMembership(tenantId);

  const parsed = upgradeCheckoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const state = upgradeStateFor(tenant, viewer);
  if (state !== UPGRADE_STATE.AVAILABLE) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: state };
  }

  const stripe = getStripeClient();
  const baseUrl = env.PLATFORM_APP_BASE_URL;
  if (!stripe || !baseUrl) {
    logger.error(BILLING_LOG.CHECKOUT_UNCONFIGURED, {
      tenantId,
      hasStripeKey: Boolean(stripe),
      hasBaseUrl: Boolean(baseUrl),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  try {
    const customerId = await ensureStripeCustomer(
      stripe,
      tenant,
      await getSessionEmail(),
    );
    if (await hasLiveSubscription(stripe, customerId)) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPGRADE_PAYMENT.PAYMENT_PENDING,
      };
    }
    await expireOpenCheckouts(stripe, customerId);

    const clientSecret = await createPlanCheckoutSession(stripe, {
      ...parsed.data,
      tenantId,
      customerId,
      returnUrl: toReturnUrl(baseUrl),
    });
    if (!clientSecret) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    return { outcome: ACTION_OUTCOME.SUCCESS, clientSecret };
  } catch (error) {
    logger.error(BILLING_LOG.CHECKOUT_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
