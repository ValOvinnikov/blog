import { pathToFileURL } from 'node:url';

import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import {
  CATALOGUE_PRICE_EXPAND,
  CATALOGUE_PROMOTION_CODE_EXPAND,
} from '@platform/server/billing/catalogue/catalogue-expand';
import { saveOrRemoveCataloguePrice } from '@platform/server/billing/catalogue/sync-catalogue-price';
import { saveOrRemoveCataloguePromotionCode } from '@platform/server/billing/catalogue/sync-catalogue-promotion-code';
import { toListExpand } from '@platform/server/billing/catalogue/to-list-expand';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

// Stripe's prices.list takes at most this many lookup keys per call.
export const LOOKUP_KEYS_PER_LIST = 10;

const lookupKeyChunks = (): string[][] => {
  const keys = Object.values(STRIPE_PRICE_LOOKUP_KEY);
  return Array.from(
    { length: Math.ceil(keys.length / LOOKUP_KEYS_PER_LIST) },
    (_, index) =>
      keys.slice(
        index * LOOKUP_KEYS_PER_LIST,
        (index + 1) * LOOKUP_KEYS_PER_LIST,
      ),
  );
};

export type TStripeCatalogueSyncSummary = {
  prices: number;
  promotionCodes: number;
};

export const syncStripeCatalogue = async (
  stripe: Stripe,
): Promise<TStripeCatalogueSyncSummary> => {
  const summary: TStripeCatalogueSyncSummary = { prices: 0, promotionCodes: 0 };

  for (const lookupKeys of lookupKeyChunks()) {
    for await (const price of stripe.prices.list({
      lookup_keys: lookupKeys,
      active: true,
      expand: toListExpand(CATALOGUE_PRICE_EXPAND),
    })) {
      await saveOrRemoveCataloguePrice(price);
      summary.prices += 1;
    }
  }

  for await (const promotionCode of stripe.promotionCodes.list({
    active: true,
    expand: toListExpand(CATALOGUE_PROMOTION_CODE_EXPAND),
  })) {
    await saveOrRemoveCataloguePromotionCode(promotionCode);
    summary.promotionCodes += 1;
  }

  return summary;
};

const main = async (): Promise<void> => {
  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED);
    process.exitCode = 1;
    return;
  }

  try {
    logger.info(
      BILLING_LOG.CATALOGUE_SYNCED,
      await syncStripeCatalogue(stripe),
    );
  } catch (error) {
    logger.error(BILLING_LOG.CATALOGUE_SYNC_FAILED, toLoggableError(error));
    process.exitCode = 1;
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
