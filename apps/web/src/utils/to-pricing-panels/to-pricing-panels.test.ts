import { PRICE_PERIOD } from '@blog/config';
import {
  mockPricingPrice,
  mockPricingTier,
  MOCK_PRICING_LABELS,
} from '@web/testing/modules/pricing/fixtures';

import { toPricingPanels } from './to-pricing-panels';

const PRICE_LABEL = 'Contact us';
const ONE_TIME_EXTRA = '£99 one-time';

const setup = (tiers: Parameters<typeof toPricingPanels>[0]['tiers']) =>
  toPricingPanels({
    tiers,
    locale: 'en-GB',
    currency: 'GBP',
    labels: MOCK_PRICING_LABELS,
  });

const monthlyAndYearly = mockPricingTier({
  id: 'pro',
  prices: [
    mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
    mockPricingPrice({ period: PRICE_PERIOD.YEAR, amount: 490 }),
    mockPricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49 }),
  ],
});

const setupBesideMonthlyAndYearly = (
  tier: ReturnType<typeof mockPricingTier>,
) => setup([monthlyAndYearly, tier]);

const firstPanelFor = (prices: ReturnType<typeof mockPricingPrice>[]) => {
  const [panel] = setup([mockPricingTier({ prices })]);
  return panel;
};

describe(toPricingPanels, () => {
  it('returns one panel without a period when only one tab period exists', () => {
    const panels = setup([mockPricingTier()]);

    expect(panels).toHaveLength(1);
    expect(panels[0]?.period).toBeUndefined();
  });

  it('keeps the authored order when there is no switch', () => {
    const panel = firstPanelFor([
      mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
      mockPricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49 }),
    ]);

    expect(panel?.cards[0]?.headline?.amount).toBe('£99');
    expect(panel?.cards[0]?.extras).toEqual(['£49 per month']);
  });

  describe('with a monthly and a yearly price', () => {
    let panels: ReturnType<typeof setup>;

    beforeEach(() => {
      panels = setup([monthlyAndYearly]);
    });

    it('returns a monthly then a yearly panel when both periods exist', () => {
      expect(panels.map(({ period }) => period)).toEqual([
        PRICE_PERIOD.MONTH,
        PRICE_PERIOD.YEAR,
      ]);
    });

    it('heads each tab with its own price and drops the other tab price', () => {
      const [monthly, yearly] = panels;

      expect(monthly?.cards[0]?.headline).toMatchObject({
        amount: '£49',
        period: 'per month',
      });
      expect(monthly?.cards[0]?.extras).toEqual([ONE_TIME_EXTRA]);
      expect(yearly?.cards[0]?.headline).toMatchObject({
        amount: '£490',
        period: 'per year',
      });
      expect(yearly?.cards[0]?.extras).toEqual([ONE_TIME_EXTRA]);
    });
  });

  it('shows a label-only tier the same on both tabs', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: 'custom',
        prices: [],
        priceLabel: PRICE_LABEL,
      }),
    );

    expect(monthly?.cards[1]).toMatchObject({
      headline: undefined,
      label: PRICE_LABEL,
    });
    expect(yearly?.cards[1]).toMatchObject({
      headline: undefined,
      label: PRICE_LABEL,
    });
  });

  it('prefixes a starting-at price and omits the period of a free price', () => {
    const panel = firstPanelFor([
      mockPricingPrice({ amount: 49, isStartingAt: true }),
      mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 0 }),
    ]);

    expect(panel?.cards[0]?.headline).toMatchObject({
      prefix: 'From',
      amount: '£49',
    });
    expect(panel?.cards[0]?.extras).toEqual(['Free']);
  });

  it('pairs the compare-at amount with its translated label', () => {
    const panel = firstPanelFor([
      mockPricingPrice({ amount: 39, compareAtAmount: 49 }),
    ]);

    expect(panel?.cards[0]?.headline?.compareAt).toEqual({
      amount: '£49',
      label: 'Regular price',
    });
  });

  it('heads the monthly tab with the first price of a yearly-only tier', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: 'annual',
        prices: [mockPricingPrice({ period: PRICE_PERIOD.YEAR, amount: 300 })],
      }),
    );

    expect(monthly?.cards[1]?.headline).toMatchObject({
      amount: '£300',
      period: 'per year',
    });
    expect(monthly?.cards[1]?.extras).toEqual([]);
    expect(yearly?.cards[1]?.headline).toMatchObject({ amount: '£300' });
  });

  it('heads the yearly tab with the first price of a monthly-only tier', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: 'flex',
        prices: [
          mockPricingPrice({ period: PRICE_PERIOD.MONTH, amount: 9 }),
          mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 20 }),
        ],
      }),
    );

    expect(yearly?.cards[1]?.headline).toMatchObject({
      amount: '£9',
      period: 'per month',
    });
    expect(yearly?.cards[1]?.extras).toEqual(['£20 one-time']);
    expect(monthly?.cards[1]?.headline).toMatchObject({ amount: '£9' });
  });
});
