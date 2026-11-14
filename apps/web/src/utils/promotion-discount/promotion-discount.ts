import type { TMaybeUndefined } from '@blog/config';
import {
  BILLING_CURRENCY,
  STRIPE_COUPON_DURATION,
  type TBillingCurrency,
} from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import { z } from 'zod';

export const promotionDiscountSchema = z.object({
  code: z.string(),
  percentOff: z.number().optional(),
  amountOffByCurrency: z
    .partialRecord(z.enum(BILLING_CURRENCY), z.number())
    .optional(),
  duration: z.enum(STRIPE_COUPON_DURATION),
  durationInMonths: z.number().optional(),
  appliesToProductIds: z.array(z.string()).optional(),
});

export type TPromotionDiscount = z.infer<typeof promotionDiscountSchema>;

export interface IDiscountedPrice {
  currency: TBillingCurrency;
  unitAmount: number;
  productId: string;
}

const PERCENT = 100;

export const toDiscountedUnitAmount = (
  discount: TPromotionDiscount,
  { currency, unitAmount, productId }: IDiscountedPrice,
): TMaybeUndefined<number> => {
  const { percentOff, amountOffByCurrency, appliesToProductIds } = discount;
  if (appliesToProductIds && !appliesToProductIds.includes(productId)) {
    return undefined;
  }
  if (!isUndefined(percentOff)) {
    return Math.round(unitAmount * (1 - percentOff / PERCENT));
  }
  const amountOff = amountOffByCurrency?.[currency];
  return isUndefined(amountOff)
    ? undefined
    : Math.max(0, unitAmount - amountOff);
};
