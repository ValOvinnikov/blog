import { getDb } from '@blog/db/client';
import { stripePromotionCodes } from '@blog/db/schema/stripe-catalogue';
import { eq } from 'drizzle-orm';

export async function removeStripePromotionCode(
  promotionCodeId: string,
): Promise<void> {
  await getDb()
    .delete(stripePromotionCodes)
    .where(eq(stripePromotionCodes.promotionCodeId, promotionCodeId));
}
