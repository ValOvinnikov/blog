import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { PLAN_PRICE_LOOKUP_KEYS, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_TENANT_METADATA_KEY,
  type TBillingInterval,
} from '@platform/constants/billing';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

export type TGrowthCheckoutRequest = {
  tenant: Pick<TTenant, 'id' | 'stripeCustomerId'>;
  interval: TBillingInterval;
  returnUrl: string;
  promo?: string;
  email?: string;
};

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
  code: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<string>> => {
  if (!code) return undefined;
  const { data } = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });
  return data[0]?.id;
};

export const createGrowthCheckoutSession = async (
  stripe: Stripe,
  { tenant, interval, returnUrl, promo, email }: TGrowthCheckoutRequest,
): Promise<TMaybeUndefined<string>> => {
  const { id: tenantId, stripeCustomerId } = tenant;
  const [price, promotionCodeId] = await Promise.all([
    findGrowthPrice(stripe, interval),
    findPromotionCodeId(stripe, promo),
  ]);
  if (!price) {
    logger.error(BILLING_LOG.CHECKOUT_PRICE_MISSING, { tenantId, interval });
    return undefined;
  }

  const metadata = { [STRIPE_TENANT_METADATA_KEY]: tenantId };
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    automatic_tax: { enabled: true },
    ...(promotionCodeId
      ? { discounts: [{ promotion_code: promotionCodeId }] }
      : { allow_promotion_codes: true }),
    ...(stripeCustomerId
      ? {
          customer: stripeCustomerId,
          customer_update: { address: 'auto', name: 'auto' },
        }
      : { customer_email: email }),
    client_reference_id: tenantId,
    metadata,
    subscription_data: { metadata },
    return_url: returnUrl,
  });

  return session.client_secret ?? undefined;
};
