import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  stripePromotionCodes,
  type TAmountOffByCurrency,
} from '@blog/db/schema/stripe-catalogue';
import { and, eq, gt, isNull, or } from 'drizzle-orm';

export type TStripePromotionCode = {
  code: string;
  percentOff: TMaybeUndefined<number>;
  amountOffByCurrency: TMaybeUndefined<TAmountOffByCurrency>;
  appliesToProductIds: TMaybeUndefined<string[]>;
  expiresAt: TMaybeUndefined<Date>;
};

export async function getActiveStripePromotionCode(
  code: string,
  now: Date = new Date(),
): Promise<TMaybeUndefined<TStripePromotionCode>> {
  const [row] = await getDb()
    .select({
      code: stripePromotionCodes.code,
      percentOff: stripePromotionCodes.percentOff,
      amountOffByCurrency: stripePromotionCodes.amountOffByCurrency,
      appliesToProductIds: stripePromotionCodes.appliesToProductIds,
      expiresAt: stripePromotionCodes.expiresAt,
    })
    .from(stripePromotionCodes)
    .where(
      and(
        eq(stripePromotionCodes.code, code.trim().toUpperCase()),
        or(
          isNull(stripePromotionCodes.expiresAt),
          gt(stripePromotionCodes.expiresAt, now),
        ),
      ),
    )
    .limit(1);
  if (!row) return undefined;
  const { percentOff, amountOffByCurrency, appliesToProductIds, expiresAt } =
    row;

  return {
    code: row.code,
    percentOff: percentOff ?? undefined,
    amountOffByCurrency: amountOffByCurrency ?? undefined,
    appliesToProductIds: appliesToProductIds ?? undefined,
    expiresAt: expiresAt ?? undefined,
  };
}
