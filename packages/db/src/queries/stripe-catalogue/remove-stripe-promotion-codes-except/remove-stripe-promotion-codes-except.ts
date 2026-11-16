import { getDb } from '@shinefold/db/client';
import { stripePromotionCodes } from '@shinefold/db/schema/stripe-catalogue';
import { notInArray } from 'drizzle-orm';

export async function removeStripePromotionCodesExcept(
  keptPromotionCodeIds: string[],
): Promise<void> {
  await getDb()
    .delete(stripePromotionCodes)
    .where(
      notInArray(stripePromotionCodes.promotionCodeId, keptPromotionCodeIds),
    );
}
