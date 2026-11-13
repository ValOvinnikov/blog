import 'server-only';

import { queries } from '@blog/db';
import type Stripe from 'stripe';

import { CATALOGUE_PRICE_EXPAND } from './catalogue-expand';
import { toCataloguePrice } from './to-catalogue-price';

export const saveOrRemoveCataloguePrice = async (
  price: Stripe.Price,
): Promise<void> => {
  const cataloguePrice = toCataloguePrice(price);
  if (cataloguePrice) {
    await queries.stripeCatalogue.saveStripePrice(cataloguePrice);
  } else {
    await queries.stripeCatalogue.removeStripePrice(price.id);
  }
};

export const syncCataloguePrice = async (
  stripe: Stripe,
  priceId: string,
): Promise<void> => {
  const price = await stripe.prices.retrieve(priceId, {
    expand: CATALOGUE_PRICE_EXPAND,
  });
  await saveOrRemoveCataloguePrice(price);
};
