import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { isOneOf } from '@blog/utils/primitives';
import { BILLING_LOG } from '@platform/constants/billing';
import {
  STRIPE_KEY_MODE,
  type TStripeKeyMode,
} from '@platform/constants/stripe-key-mode';
import {
  CATALOGUE_PRICE_EXPAND,
  CATALOGUE_PROMOTION_CODE_EXPAND,
} from '@platform/server/billing/catalogue/catalogue-expand';
import { revalidatePlatformSite } from '@platform/server/billing/catalogue/revalidate-platform-site';
import { saveOrRemoveCataloguePrice } from '@platform/server/billing/catalogue/sync-catalogue-price';
import { saveOrRemoveCataloguePromotionCode } from '@platform/server/billing/catalogue/sync-catalogue-promotion-code';
import { toListExpand } from '@platform/server/billing/catalogue/to-list-expand';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
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
  const priceIds: string[] = [];
  for (const lookupKeys of lookupKeyChunks()) {
    for await (const price of stripe.prices.list({
      lookup_keys: lookupKeys,
      active: true,
      expand: toListExpand(CATALOGUE_PRICE_EXPAND),
    })) {
      await saveOrRemoveCataloguePrice(price);
      priceIds.push(price.id);
    }
  }

  const promotionCodeIds: string[] = [];
  for await (const promotionCode of stripe.promotionCodes.list({
    active: true,
    expand: toListExpand(CATALOGUE_PROMOTION_CODE_EXPAND),
  })) {
    await saveOrRemoveCataloguePromotionCode(promotionCode);
    promotionCodeIds.push(promotionCode.id);
  }

  await queries.stripeCatalogue.removeStripePricesExcept(priceIds);
  await queries.stripeCatalogue.removeStripePromotionCodesExcept(
    promotionCodeIds,
  );

  return { prices: priceIds.length, promotionCodes: promotionCodeIds.length };
};

const readSyncMode = (args: string[]): TMaybeUndefined<TStripeKeyMode> => {
  const { values } = parseArgs({
    args,
    options: { mode: { type: 'string' } },
    strict: false,
  });
  return isOneOf(Object.values(STRIPE_KEY_MODE), values.mode)
    ? values.mode
    : undefined;
};

export const runStripeCatalogueSync = async (args: string[]): Promise<void> => {
  const mode = readSyncMode(args);
  if (!mode) {
    logger.error(BILLING_LOG.CATALOGUE_SYNC_MODE_INVALID);
    process.exitCode = 1;
    return;
  }

  const key = stripeEnv.STRIPE_SECRET_KEY;
  const stripe = getStripeClient();
  if (!key || !stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED);
    process.exitCode = 1;
    return;
  }

  if (!key.startsWith(`sk_${mode}_`)) {
    logger.error(BILLING_LOG.CATALOGUE_SYNC_MODE_MISMATCH, { mode });
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
  await revalidatePlatformSite();
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runStripeCatalogueSync(process.argv.slice(2));
}
