import { getDb } from '@blog/db/client';
import { stripePromotionCodes } from '@blog/db/schema/stripe-catalogue';
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
