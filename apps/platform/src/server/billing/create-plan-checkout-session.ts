import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import {
  BILLING_LOG,
  STRIPE_TENANT_METADATA_KEY,
  type TBillingInterval,
} from '@platform/constants/billing';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import {
  findPlanPrice,
  findPromotionCodeId,
  type TPromoContext,
} from './find-checkout-catalogue';

export type TPlanCheckoutRequest = {
  tenantId: string;
  customerId: string;
  plan: TTenantPlan;
  interval: TBillingInterval;
  returnUrl: string;
  promo?: string;
};

const createSession = async (
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
  promotionCodeId: TMaybeUndefined<string>,
  context: TPromoContext,
): Promise<Stripe.Checkout.Session> => {
  const withCodeField = () =>
    stripe.checkout.sessions.create({ ...params, allow_promotion_codes: true });
  if (!promotionCodeId) return withCodeField();

  try {
    return await stripe.checkout.sessions.create({
      ...params,
      discounts: [{ promotion_code: promotionCodeId }],
    });
  } catch (error) {
    logger.warn(BILLING_LOG.CHECKOUT_PROMO_REFUSED, {
      ...context,
      ...toLoggableError(error),
    });
    return withCodeField();
  }
};

export const createPlanCheckoutSession = async (
  stripe: Stripe,
  {
    tenantId,
    customerId,
    plan,
    interval,
    returnUrl,
    promo,
  }: TPlanCheckoutRequest,
): Promise<TMaybeUndefined<string>> => {
  const context = { tenantId, promo };
  const [price, promotionCodeId] = await Promise.all([
    findPlanPrice(stripe, plan, interval),
    findPromotionCodeId(stripe, context),
  ]);
  if (!price) {
    logger.error(BILLING_LOG.CHECKOUT_PRICE_MISSING, {
      tenantId,
      plan,
      interval,
    });
    return undefined;
  }

  const metadata = { [STRIPE_TENANT_METADATA_KEY]: tenantId };
  const { client_secret } = await createSession(
    stripe,
    {
      ui_mode: 'embedded_page',
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer: customerId,
      customer_update: { address: 'auto', name: 'auto' },
      client_reference_id: tenantId,
      metadata,
      subscription_data: { metadata },
      return_url: returnUrl,
    },
    promotionCodeId,
    context,
  );
  if (!client_secret) {
    logger.error(BILLING_LOG.CHECKOUT_FAILED, {
      tenantId,
      hasClientSecret: false,
    });
    return undefined;
  }
  return client_secret;
};
