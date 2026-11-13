import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { PLAN_PRICE_LOOKUP_KEYS, TENANT_PLAN } from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_TENANT_METADATA_KEY,
  type TBillingInterval,
} from '@platform/constants/billing';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

export type TGrowthCheckoutRequest = {
  tenantId: string;
  customerId: string;
  interval: TBillingInterval;
  returnUrl: string;
  promo?: string;
};

type TPromoContext = { tenantId: string; promo?: string };

const findGrowthPrice = async (
  stripe: Stripe,
  interval: TBillingInterval,
): Promise<TMaybeUndefined<Stripe.Price>> => {
  const keys = PLAN_PRICE_LOOKUP_KEYS[TENANT_PLAN.GROWTH];
  if (!keys) return undefined;
  const lookupKey =
    interval === BILLING_INTERVAL.YEARLY ? keys.yearly : keys.monthly;
  const { data } = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return data[0];
};

const findPromotionCodeId = async (
  stripe: Stripe,
  { tenantId, promo }: TPromoContext,
): Promise<TMaybeUndefined<string>> => {
  if (!promo) return undefined;
  try {
    const { data } = await stripe.promotionCodes.list({
      code: promo,
      active: true,
      limit: 1,
    });
    return data[0]?.id;
  } catch (error) {
    logger.warn(BILLING_LOG.CHECKOUT_PROMO_REFUSED, {
      tenantId,
      promo,
      ...toLoggableError(error),
    });
    return undefined;
  }
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

export const createGrowthCheckoutSession = async (
  stripe: Stripe,
  { tenantId, customerId, interval, returnUrl, promo }: TGrowthCheckoutRequest,
): Promise<TMaybeUndefined<string>> => {
  const context = { tenantId, promo };
  const [price, promotionCodeId] = await Promise.all([
    findGrowthPrice(stripe, interval),
    findPromotionCodeId(stripe, context),
  ]);
  if (!price) {
    logger.error(BILLING_LOG.CHECKOUT_PRICE_MISSING, { tenantId, interval });
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
