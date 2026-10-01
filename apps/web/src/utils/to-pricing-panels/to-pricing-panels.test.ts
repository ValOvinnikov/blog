import { PRICE_PERIOD } from '@blog/config';
import {
  makePricingPrice,
  makePricingTier,
} from '@web/testing/modules/pricing/fixtures';

import { toPricingPanels } from './to-pricing-panels';

const labels = {
  free: 'Free',
  from: 'From',
  periods: {
    [PRICE_PERIOD.ONE_TIME]: 'one-time',
    [PRICE_PERIOD.HOUR]: '/ hour',
    [PRICE_PERIOD.SESSION]: '/ session',
    [PRICE_PERIOD.MONTH]: '/ month',
    [PRICE_PERIOD.YEAR]: '/ year',
  },
};

const setup = (tiers: Parameters<typeof toPricingPanels>[0]['tiers']) =>
  toPricingPanels({ tiers, locale: 'en-GB', currency: 'GBP', labels });

const monthlyAndYearly = makePricingTier({
  id: 'pro',
  prices: [
    makePricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
    makePricingPrice({ period: PRICE_PERIOD.YEAR, amount: 490 }),
    makePricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49 }),
  ],
});

describe(toPricingPanels.name, () => {
  it('returns one panel without a period when only one tab period exists', () => {
    const panels = setup([makePricingTier()]);

    expect(panels).toHaveLength(1);
    expect(panels[0]?.period).toBeUndefined();
  });

  it('keeps the authored order when there is no switch', () => {
    const [panel] = setup([
      makePricingTier({
        prices: [
          makePricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
          makePricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49 }),
        ],
      }),
    ]);

    expect(panel?.cards[0]?.headline?.amount).toBe('£99');
    expect(panel?.cards[0]?.extras).toEqual(['£49 / month']);
  });

  it('returns a monthly then a yearly panel when both periods exist', () => {
    const panels = setup([monthlyAndYearly]);

    expect(panels.map(({ period }) => period)).toEqual([
      PRICE_PERIOD.MONTH,
      PRICE_PERIOD.YEAR,
    ]);
  });

  it('heads each tab with its own price and drops the other tab price', () => {
    const [monthly, yearly] = setup([monthlyAndYearly]);

    expect(monthly?.cards[0]?.headline).toMatchObject({
      amount: '£49',
      period: '/ month',
    });
    expect(monthly?.cards[0]?.extras).toEqual(['£99 one-time']);
    expect(yearly?.cards[0]?.headline).toMatchObject({
      amount: '£490',
      period: '/ year',
    });
    expect(yearly?.cards[0]?.extras).toEqual(['£99 one-time']);
  });

  it('shows a label-only tier the same on both tabs', () => {
    const [monthly, yearly] = setup([
      monthlyAndYearly,
      makePricingTier({
        id: 'custom',
        prices: [],
        priceLabel: 'Contact us',
      }),
    ]);

    expect(monthly?.cards[1]).toMatchObject({
      headline: undefined,
      label: 'Contact us',
    });
    expect(yearly?.cards[1]).toMatchObject({
      headline: undefined,
      label: 'Contact us',
    });
  });

  it('prefixes a starting-at price and omits the period of a free price', () => {
    const [panel] = setup([
      makePricingTier({
        prices: [
          makePricingPrice({ amount: 49, isStartingAt: true }),
          makePricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 0 }),
        ],
      }),
    ]);

    expect(panel?.cards[0]?.headline).toMatchObject({
      prefix: 'From',
      amount: '£49',
    });
    expect(panel?.cards[0]?.extras).toEqual(['Free']);
  });
});
