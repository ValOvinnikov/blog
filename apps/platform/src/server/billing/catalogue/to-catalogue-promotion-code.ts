import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  STRIPE_COUPON_DURATION,
  type TStripeCouponDuration,
} from '@blog/db/constants';
import type { TSaveStripePromotionCodeInput } from '@blog/db/queries/stripe-catalogue/save-stripe-promotion-code';
import type { TAmountOffByCurrency } from '@blog/db/schema/stripe-catalogue';
import { hasLength, isNull, isString } from '@blog/utils/primitives';
import { fromStripeTime } from '@platform/server/billing/stripe-time';
import type Stripe from 'stripe';

import { toBillingCurrency } from './to-catalogue-price';

const COUPON_DURATION: Partial<
  Record<Stripe.Coupon.Duration, TStripeCouponDuration>
> = {
  once: STRIPE_COUPON_DURATION.ONCE,
  repeating: STRIPE_COUPON_DURATION.REPEATING,
  forever: STRIPE_COUPON_DURATION.FOREVER,
};

const isPublic = ({
  active,
  customer,
  max_redemptions: maxRedemptions,
  times_redeemed: timesRedeemed,
  restrictions,
}: Stripe.PromotionCode): boolean =>
  active &&
  !customer &&
  !restrictions.first_time_transaction &&
  !restrictions.minimum_amount &&
  (isNull(maxRedemptions) || timesRedeemed < maxRedemptions);

const toAmountOffByCurrency = ({
  amount_off: amountOff,
  currency,
  currency_options: currencyOptions,
}: Stripe.Coupon): TMaybeUndefined<TAmountOffByCurrency> => {
  if (isNull(amountOff) || !currency) return undefined;
  const entries = Object.entries({
    ...currencyOptions,
    [currency]: { amount_off: amountOff },
  }).flatMap(([stripeCurrency, option]) => {
    const billingCurrency = toBillingCurrency(stripeCurrency);
    return billingCurrency
      ? [[billingCurrency, option.amount_off] as const]
      : [];
  });
  return hasLength(entries) ? Object.fromEntries(entries) : undefined;
};

const earliestExpiry = (
  ...timestamps: TMaybeNull<number>[]
): TMaybeUndefined<Date> => {
  const set = timestamps.filter((value): value is number => !isNull(value));
  return hasLength(set) ? fromStripeTime(Math.min(...set)) : undefined;
};

export const toCataloguePromotionCode = (
  promotionCode: Stripe.PromotionCode,
): TMaybeUndefined<TSaveStripePromotionCodeInput> => {
  const coupon = promotionCode.promotion.coupon;
  if (!coupon || isString(coupon) || !coupon.valid) return undefined;
  const duration = COUPON_DURATION[coupon.duration];
  if (!duration || !isPublic(promotionCode)) return undefined;
  const percentOff = coupon.percent_off ?? undefined;
  const amountOffByCurrency = toAmountOffByCurrency(coupon);
  if (!percentOff && !amountOffByCurrency) return undefined;

  return {
    promotionCodeId: promotionCode.id,
    code: promotionCode.code,
    percentOff,
    amountOffByCurrency,
    duration,
    durationInMonths: coupon.duration_in_months ?? undefined,
    appliesToProductIds: coupon.applies_to?.products,
    expiresAt: earliestExpiry(promotionCode.expires_at, coupon.redeem_by),
  };
};
