import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type { TStripeCouponDuration } from '@blog/db/constants';
import {
  stripePromotionCodes,
  type TAmountOffByCurrency,
} from '@blog/db/schema/stripe-catalogue';
import { and, eq, ne, sql } from 'drizzle-orm';

export type TSaveStripePromotionCodeInput = {
  promotionCodeId: string;
  code: string;
  percentOff: TMaybeUndefined<number>;
  amountOffByCurrency: TMaybeUndefined<TAmountOffByCurrency>;
  duration: TStripeCouponDuration;
  durationInMonths: TMaybeUndefined<number>;
  appliesToProductIds: TMaybeUndefined<string[]>;
  expiresAt: TMaybeUndefined<Date>;
};

// One statement, because `neon-http` has no transactions: an older promotion code that reused this code string is replaced, so the newest wins.
export async function saveStripePromotionCode({
  promotionCodeId,
  code,
  percentOff,
  amountOffByCurrency,
  duration,
  durationInMonths,
  appliesToProductIds,
  expiresAt,
}: TSaveStripePromotionCodeInput): Promise<void> {
  const db = getDb();
  const normalizedCode = code.toUpperCase();

  const replacedCode = db.$with('replaced_code').as(
    db
      .delete(stripePromotionCodes)
      .where(
        and(
          eq(stripePromotionCodes.code, normalizedCode),
          ne(stripePromotionCodes.promotionCodeId, promotionCodeId),
        ),
      )
      .returning({ promotionCodeId: stripePromotionCodes.promotionCodeId }),
  );

  await db
    .with(replacedCode)
    .insert(stripePromotionCodes)
    .values({
      promotionCodeId,
      code: normalizedCode,
      percentOff: percentOff ?? null,
      amountOffByCurrency: amountOffByCurrency ?? null,
      duration,
      durationInMonths: durationInMonths ?? null,
      appliesToProductIds: appliesToProductIds ?? null,
      expiresAt: expiresAt ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: stripePromotionCodes.promotionCodeId,
      set: {
        code: sql`excluded.code`,
        percentOff: sql`excluded.percent_off`,
        amountOffByCurrency: sql`excluded.amount_off_by_currency`,
        duration: sql`excluded.duration`,
        durationInMonths: sql`excluded.duration_in_months`,
        appliesToProductIds: sql`excluded.applies_to_product_ids`,
        expiresAt: sql`excluded.expires_at`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}
