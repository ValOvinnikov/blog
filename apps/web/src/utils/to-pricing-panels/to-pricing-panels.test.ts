import { PRICE_PERIOD } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  mockPricingPrice,
  mockPricingTier,
  MOCK_PRICING_LABELS,
} from '@web/testing/modules/pricing/fixtures';

import { toPricingPanels } from './to-pricing-panels';

faker.seed(6012);

const { free, from, compareAtLabel, periods } = MOCK_PRICING_LABELS;

const MOCK_MONTHLY_AMOUNT = faker.number.int({ min: 10, max: 99 });
const MOCK_YEARLY_AMOUNT = faker.number.int({ min: 100, max: 299 });
const MOCK_ONE_TIME_AMOUNT = faker.number.int({ min: 300, max: 499 });
const MOCK_SALE_AMOUNT = faker.number.int({ min: 500, max: 699 });
const MOCK_COMPARE_AT_AMOUNT = faker.number.int({ min: 700, max: 899 });
const MOCK_PRICE_LABEL = faker.lorem.words(2);

const formatPounds = (amount: number) => `£${amount}`;

const setup = (tiers: Parameters<typeof toPricingPanels>[0]['tiers']) =>
  toPricingPanels({
    tiers,
    locale: 'en-GB',
    currency: 'GBP',
    labels: MOCK_PRICING_LABELS,
  });

const monthlyAndYearly = mockPricingTier({
  id: faker.string.uuid(),
  prices: [
    mockPricingPrice({
      period: PRICE_PERIOD.ONE_TIME,
      amount: MOCK_ONE_TIME_AMOUNT,
    }),
    mockPricingPrice({ period: PRICE_PERIOD.YEAR, amount: MOCK_YEARLY_AMOUNT }),
    mockPricingPrice({
      period: PRICE_PERIOD.MONTH,
      amount: MOCK_MONTHLY_AMOUNT,
    }),
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
      mockPricingPrice({
        period: PRICE_PERIOD.ONE_TIME,
        amount: MOCK_ONE_TIME_AMOUNT,
      }),
      mockPricingPrice({
        period: PRICE_PERIOD.MONTH,
        amount: MOCK_MONTHLY_AMOUNT,
      }),
    ]);

    expect(panel?.cards[0]?.headline?.amount).toBe(
      formatPounds(MOCK_ONE_TIME_AMOUNT),
    );
    expect(panel?.cards[0]?.extras).toEqual([
      `${formatPounds(MOCK_MONTHLY_AMOUNT)} ${periods[PRICE_PERIOD.MONTH]}`,
    ]);
  });

  describe('with a monthly and a yearly price', () => {
    let panels: ReturnType<typeof setup>;
    const oneTimeExtra = `${formatPounds(MOCK_ONE_TIME_AMOUNT)} ${periods[PRICE_PERIOD.ONE_TIME]}`;

    beforeEach(() => {
      panels = setup([monthlyAndYearly]);
    });

    it('returns a monthly then a yearly panel', () => {
      expect(panels.map(({ period }) => period)).toEqual([
        PRICE_PERIOD.MONTH,
        PRICE_PERIOD.YEAR,
      ]);
    });

    it('heads each tab with its own price and drops the other tab price', () => {
      const [monthly, yearly] = panels;

      expect(monthly?.cards[0]?.headline).toEqual({
        amount: formatPounds(MOCK_MONTHLY_AMOUNT),
        compareAt: undefined,
        period: periods[PRICE_PERIOD.MONTH],
        prefix: undefined,
      });
      expect(monthly?.cards[0]?.extras).toEqual([oneTimeExtra]);
      expect(yearly?.cards[0]?.headline).toEqual({
        amount: formatPounds(MOCK_YEARLY_AMOUNT),
        compareAt: undefined,
        period: periods[PRICE_PERIOD.YEAR],
        prefix: undefined,
      });
      expect(yearly?.cards[0]?.extras).toEqual([oneTimeExtra]);
    });
  });

  it('shows a label-only tier the same on both tabs', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: faker.string.uuid(),
        prices: [],
        priceLabel: MOCK_PRICE_LABEL,
      }),
    );

    expect(monthly?.cards[1]?.headline).toBeUndefined();
    expect(monthly?.cards[1]?.label).toBe(MOCK_PRICE_LABEL);
    expect(yearly?.cards[1]?.headline).toBeUndefined();
    expect(yearly?.cards[1]?.label).toBe(MOCK_PRICE_LABEL);
  });

  it('prefixes a starting-at price and omits the period of a free price', () => {
    const panel = firstPanelFor([
      mockPricingPrice({ amount: MOCK_MONTHLY_AMOUNT, isStartingAt: true }),
      mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 0 }),
    ]);

    expect(panel?.cards[0]?.headline?.prefix).toBe(from);
    expect(panel?.cards[0]?.headline?.amount).toBe(
      formatPounds(MOCK_MONTHLY_AMOUNT),
    );
    expect(panel?.cards[0]?.extras).toEqual([free]);
  });

  it('pairs the compare-at amount with its translated label', () => {
    const panel = firstPanelFor([
      mockPricingPrice({
        amount: MOCK_SALE_AMOUNT,
        compareAtAmount: MOCK_COMPARE_AT_AMOUNT,
      }),
    ]);

    expect(panel?.cards[0]?.headline?.compareAt).toEqual({
      amount: formatPounds(MOCK_COMPARE_AT_AMOUNT),
      label: compareAtLabel,
    });
  });

  it('heads the monthly tab with the first price of a yearly-only tier', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: faker.string.uuid(),
        prices: [
          mockPricingPrice({
            period: PRICE_PERIOD.YEAR,
            amount: MOCK_SALE_AMOUNT,
          }),
        ],
      }),
    );

    expect(monthly?.cards[1]?.headline?.amount).toBe(
      formatPounds(MOCK_SALE_AMOUNT),
    );
    expect(monthly?.cards[1]?.headline?.period).toBe(
      periods[PRICE_PERIOD.YEAR],
    );
    expect(monthly?.cards[1]?.extras).toEqual([]);
    expect(yearly?.cards[1]?.headline?.amount).toBe(
      formatPounds(MOCK_SALE_AMOUNT),
    );
  });

  it('heads the yearly tab with the first price of a monthly-only tier', () => {
    const [monthly, yearly] = setupBesideMonthlyAndYearly(
      mockPricingTier({
        id: faker.string.uuid(),
        prices: [
          mockPricingPrice({
            period: PRICE_PERIOD.MONTH,
            amount: MOCK_SALE_AMOUNT,
          }),
          mockPricingPrice({
            period: PRICE_PERIOD.ONE_TIME,
            amount: MOCK_COMPARE_AT_AMOUNT,
          }),
        ],
      }),
    );

    expect(yearly?.cards[1]?.headline?.amount).toBe(
      formatPounds(MOCK_SALE_AMOUNT),
    );
    expect(yearly?.cards[1]?.headline?.period).toBe(
      periods[PRICE_PERIOD.MONTH],
    );
    expect(yearly?.cards[1]?.extras).toEqual([
      `${formatPounds(MOCK_COMPARE_AT_AMOUNT)} ${periods[PRICE_PERIOD.ONE_TIME]}`,
    ]);
    expect(monthly?.cards[1]?.headline?.amount).toBe(
      formatPounds(MOCK_SALE_AMOUNT),
    );
  });
});
