import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  stripePromotionCodes,
  type TAmountOffByCurrency,
} from '@blog/db/schema/stripe-catalogue';
import { sql } from 'drizzle-orm';

export type TSaveStripePromotionCodeInput = {
  promotionCodeId: string;
  code: string;
  percentOff: TMaybeUndefined<number>;
  amountOffByCurrency: TMaybeUndefined<TAmountOffByCurrency>;
  appliesToProductIds: TMaybeUndefined<string[]>;
  expiresAt: TMaybeUndefined<Date>;
};

export async function saveStripePromotionCode({
  promotionCodeId,
  code,
  percentOff,
  amountOffByCurrency,
  appliesToProductIds,
  expiresAt,
}: TSaveStripePromotionCodeInput): Promise<void> {
  await getDb()
    .insert(stripePromotionCodes)
    .values({
      promotionCodeId,
      code: code.toUpperCase(),
      percentOff: percentOff ?? null,
      amountOffByCurrency: amountOffByCurrency ?? null,
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
        appliesToProductIds: sql`excluded.applies_to_product_ids`,
        expiresAt: sql`excluded.expires_at`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}
