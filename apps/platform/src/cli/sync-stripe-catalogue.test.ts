import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import { STRIPE_KEY_MODE } from '@platform/constants/stripe-key-mode';
import { revalidatePlatformSite } from '@platform/server/billing/catalogue/revalidate-platform-site';
import { saveOrRemoveCataloguePrice } from '@platform/server/billing/catalogue/sync-catalogue-price';
import { saveOrRemoveCataloguePromotionCode } from '@platform/server/billing/catalogue/sync-catalogue-promotion-code';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import {
  mockStripeCataloguePrice,
  mockStripeCataloguePromotionCode,
} from '@platform/testing/billing/catalogue';
import {
  MOCK_STRIPE_PRICE_ID,
  MOCK_STRIPE_PROMOTION_CODE_ID,
  MOCK_STRIPE_SECRET_KEY,
} from '@platform/testing/billing/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import type Stripe from 'stripe';

import {
  LOOKUP_KEYS_PER_LIST,
  runStripeCatalogueSync,
  syncStripeCatalogue,
} from './sync-stripe-catalogue';

const { catalogueMocks } = vi.hoisted(() => ({
  catalogueMocks: {
    removeStripePricesExcept: vi.fn(),
    removeStripePromotionCodesExcept: vi.fn(),
  },
}));

vi.mock('@blog/db', () => ({ queries: { stripeCatalogue: catalogueMocks } }));

vi.mock('@platform/server/billing/catalogue/sync-catalogue-price', () => ({
  saveOrRemoveCataloguePrice: vi.fn(),
}));
vi.mock(
  '@platform/server/billing/catalogue/sync-catalogue-promotion-code',
  () => ({ saveOrRemoveCataloguePromotionCode: vi.fn() }),
);
vi.mock('@platform/server/billing/stripe-client');
vi.mock('@platform/server/billing/catalogue/revalidate-platform-site', () => ({
  revalidatePlatformSite: vi.fn(),
}));
vi.mock('@platform/utils/stripe-env/stripe-env');

const stripeEnvMock: { STRIPE_SECRET_KEY?: string } = stripeEnv;
const MOCK_LIVE_SECRET_KEY = MOCK_STRIPE_SECRET_KEY.replace(
  `_${STRIPE_KEY_MODE.TEST}_`,
  `_${STRIPE_KEY_MODE.LIVE}_`,
);
const modeArgs = (mode: string) => ['--mode', mode];

const MOCK_PRICE = mockStripeCataloguePrice();
const MOCK_PROMOTION_CODE = mockStripeCataloguePromotionCode();

const mockStripe = (): Stripe =>
  ({
    prices: { list: vi.fn(() => [MOCK_PRICE]) },
    promotionCodes: { list: vi.fn(() => [MOCK_PROMOTION_CODE]) },
  }) as unknown as Stripe;

describe(syncStripeCatalogue, () => {
  let stripe: Stripe;

  beforeEach(() => {
    stripe = mockStripe();
  });

  it('asks for every plan lookup key, within Stripe’s per-call limit', async () => {
    await syncStripeCatalogue(stripe);

    const requestedKeys = vi
      .mocked(stripe.prices.list)
      .mock.calls.flatMap(([params]) => params?.lookup_keys ?? []);
    expect(requestedKeys.toSorted()).toEqual(
      Object.values(STRIPE_PRICE_LOOKUP_KEY).toSorted(),
    );
    expect(
      vi
        .mocked(stripe.prices.list)
        .mock.calls.every(
          ([params]) =>
            (params?.lookup_keys?.length ?? 0) <= LOOKUP_KEYS_PER_LIST,
        ),
    ).toBe(true);
  });

  it('saves or removes each Price and promotion code it finds, then prunes the rest', async () => {
    const summary = await syncStripeCatalogue(stripe);

    const listCalls = vi.mocked(stripe.prices.list).mock.calls.length;
    expect(summary).toEqual({ prices: listCalls, promotionCodes: 1 });
    expect(saveOrRemoveCataloguePrice).toHaveBeenCalledWith(MOCK_PRICE);
    expect(saveOrRemoveCataloguePromotionCode).toHaveBeenCalledWith(
      MOCK_PROMOTION_CODE,
    );
    expect(catalogueMocks.removeStripePricesExcept).toHaveBeenCalledWith(
      expect.arrayContaining([MOCK_STRIPE_PRICE_ID]),
    );
    expect(
      catalogueMocks.removeStripePromotionCodesExcept,
    ).toHaveBeenCalledWith([MOCK_STRIPE_PROMOTION_CODE_ID]);
  });

  it('removes nothing when listing fails part-way', async () => {
    vi.mocked(stripe.promotionCodes.list).mockImplementation(() => {
      throw new Error();
    });

    await expect(syncStripeCatalogue(stripe)).rejects.toThrow();

    expect(catalogueMocks.removeStripePricesExcept).not.toHaveBeenCalled();
  });
});

describe(runStripeCatalogueSync, () => {
  beforeEach(() => {
    process.exitCode = undefined;
    stripeEnvMock.STRIPE_SECRET_KEY = MOCK_STRIPE_SECRET_KEY;
    vi.mocked(getStripeClient).mockReturnValue(mockStripe());
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('syncs and refreshes the platform site when the key matches the mode', async () => {
    await runStripeCatalogueSync(modeArgs(STRIPE_KEY_MODE.TEST));

    expect(logger.info).toHaveBeenCalledWith(
      BILLING_LOG.CATALOGUE_SYNCED,
      expect.any(Object),
    );
    expect(revalidatePlatformSite).toHaveBeenCalledOnce();
    expect(process.exitCode).toBeUndefined();
  });

  it.each([
    [STRIPE_KEY_MODE.LIVE, MOCK_STRIPE_SECRET_KEY],
    [STRIPE_KEY_MODE.TEST, MOCK_LIVE_SECRET_KEY],
  ])('refuses --mode %s with a key of the other mode', async (mode, key) => {
    stripeEnvMock.STRIPE_SECRET_KEY = key;

    await runStripeCatalogueSync(modeArgs(mode));

    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.CATALOGUE_SYNC_MODE_MISMATCH,
      { mode },
    );
    expect(saveOrRemoveCataloguePrice).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it.each([[[]], [modeArgs(MOCK_STRIPE_PRICE_ID)]])(
    'refuses to run without a valid --mode (%j)',
    async (args) => {
      await runStripeCatalogueSync(args);

      expect(logger.error).toHaveBeenCalledWith(
        BILLING_LOG.CATALOGUE_SYNC_MODE_INVALID,
      );
      expect(getStripeClient).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    },
  );
});
