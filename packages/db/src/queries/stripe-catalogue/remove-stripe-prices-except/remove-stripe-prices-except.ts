import { getDb } from '@shinefold/db/client';
import { stripePrices } from '@shinefold/db/schema/stripe-catalogue';
import { notInArray } from 'drizzle-orm';

export async function removeStripePricesExcept(
  keptStripePriceIds: string[],
): Promise<void> {
  await getDb()
    .delete(stripePrices)
    .where(notInArray(stripePrices.stripePriceId, keptStripePriceIds));
}
