import { getDb } from '@blog/db/client';
import { stripePrices } from '@blog/db/schema/stripe-catalogue';
import { eq } from 'drizzle-orm';

export async function removeStripePrice(stripePriceId: string): Promise<void> {
  await getDb()
    .delete(stripePrices)
    .where(eq(stripePrices.stripePriceId, stripePriceId));
}
