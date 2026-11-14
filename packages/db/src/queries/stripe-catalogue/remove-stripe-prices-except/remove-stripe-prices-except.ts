import { getDb } from '@blog/db/client';
import { stripePrices } from '@blog/db/schema/stripe-catalogue';
import { notInArray } from 'drizzle-orm';

export async function removeStripePricesExcept(
  keptStripePriceIds: string[],
): Promise<void> {
  await getDb()
    .delete(stripePrices)
    .where(notInArray(stripePrices.stripePriceId, keptStripePriceIds));
}
