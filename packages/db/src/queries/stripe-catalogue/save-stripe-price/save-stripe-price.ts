import { getDb } from '@blog/db/client';
import type {
  TBillingCurrency,
  TStripePriceLookupKey,
} from '@blog/db/constants';
import { stripePrices } from '@blog/db/schema/stripe-catalogue';
import { hasLength } from '@blog/utils/primitives';
import { and, eq, notInArray, sql } from 'drizzle-orm';

export type TStripePriceAmount = {
  currency: TBillingCurrency;
  unitAmount: number;
};

export type TSaveStripePriceInput = {
  lookupKey: TStripePriceLookupKey;
  stripePriceId: string;
  stripeProductId: string;
  amounts: TStripePriceAmount[];
};

// One statement, because `neon-http` has no transactions: the new amounts and the removal of currencies the Price dropped land together.
export async function saveStripePrice({
  lookupKey,
  stripePriceId,
  stripeProductId,
  amounts,
}: TSaveStripePriceInput): Promise<void> {
  const db = getDb();

  if (!hasLength(amounts)) {
    await db.delete(stripePrices).where(eq(stripePrices.lookupKey, lookupKey));
    return;
  }

  const updatedAt = new Date();
  const currencies = amounts.map(({ currency }) => currency);

  const droppedCurrencies = db.$with('dropped_currencies').as(
    db
      .delete(stripePrices)
      .where(
        and(
          eq(stripePrices.lookupKey, lookupKey),
          notInArray(stripePrices.currency, currencies),
        ),
      )
      .returning({ currency: stripePrices.currency }),
  );

  await db
    .with(droppedCurrencies)
    .insert(stripePrices)
    .values(
      amounts.map(({ currency, unitAmount }) => ({
        lookupKey,
        currency,
        unitAmount,
        stripePriceId,
        stripeProductId,
        updatedAt,
      })),
    )
    .onConflictDoUpdate({
      target: [stripePrices.lookupKey, stripePrices.currency],
      set: {
        unitAmount: sql`excluded.unit_amount`,
        stripePriceId: sql`excluded.stripe_price_id`,
        stripeProductId: sql`excluded.stripe_product_id`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}
