import type {
  TBillingCurrency,
  TStripePriceLookupKey,
} from '@blog/db/constants';
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const stripePrices = pgTable(
  'stripe_prices',
  {
    lookupKey: text('lookup_key').$type<TStripePriceLookupKey>().notNull(),
    currency: text('currency').$type<TBillingCurrency>().notNull(),
    unitAmount: integer('unit_amount').notNull(),
    stripePriceId: text('stripe_price_id').notNull(),
    stripeProductId: text('stripe_product_id').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (price) => [
    primaryKey({ columns: [price.lookupKey, price.currency] }),
    index('stripe_prices_stripe_price_id_idx').on(price.stripePriceId),
  ],
);

export type TStripePriceRow = typeof stripePrices.$inferSelect;

export type TAmountOffByCurrency = Partial<Record<TBillingCurrency, number>>;

export const stripePromotionCodes = pgTable('stripe_promotion_codes', {
  promotionCodeId: text('promotion_code_id').primaryKey(),
  code: text('code').notNull().unique(),
  percentOff: doublePrecision('percent_off'),
  amountOffByCurrency: jsonb(
    'amount_off_by_currency',
  ).$type<TAmountOffByCurrency>(),
  appliesToProductIds: text('applies_to_product_ids').array(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
});

export type TStripePromotionCodeRow = typeof stripePromotionCodes.$inferSelect;
