import { BILLING_CURRENCY, STRIPE_COUPON_DURATION } from '@blog/db/constants';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_DURATION_IN_MONTHS,
  MOCK_EURO_AMOUNT,
  MOCK_PERCENT_OFF,
  MOCK_PROMOTION_CODE,
  MOCK_STRIPE_PRODUCT_ID,
} from '@blog/db/testing/stripe-catalogue/fixtures';
import { faker } from '@faker-js/faker';
import { PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { MOCK_CTA_PRIMARY_ACTION } from '@web/testing/modules/cta/fixtures';
import {
  mockPricingCard,
  MOCK_PRICING_LABELS,
} from '@web/testing/modules/pricing/fixtures';
import {
  mockLivePlanPrice,
  mockPromotionDiscount,
  formatMockUnitAmount,
  percentOffUnitAmount,
} from '@web/testing/modules/pricing/live-price-fixtures';

import { toLivePricingCard } from './to-live-pricing-card';

faker.seed(6882);

const MOCK_LOCALE = 'en-GB';
const MOCK_ONCE_LABEL = faker.lorem.words(3);
const MOCK_REPEATING_LABEL = faker.lorem.words(2);
const MOCK_AMOUNT_OFF = faker.number.int({ min: 100, max: 400 });
const MOCK_OTHER_PRODUCT_ID = `prod_${faker.string.alphanumeric(14)}`;

const { free, compareAtLabel } = MOCK_PRICING_LABELS;
const repeatingLabel = (months: number) => `${MOCK_REPEATING_LABEL} ${months}`;

const format = (unitAmount: number, currency: string) =>
  formatMockUnitAmount(unitAmount, currency, MOCK_LOCALE);

const setup = (
  overrides: Partial<Parameters<typeof toLivePricingCard>[0]> = {},
) =>
  toLivePricingCard({
    card: mockPricingCard({ ctaButtons: [MOCK_CTA_PRIMARY_ACTION] }),
    livePrice: mockLivePlanPrice(),
    currency: BILLING_CURRENCY.USD,
    discount: undefined,
    locale: MOCK_LOCALE,
    labels: {
      free,
      compareAtLabel,
      once: MOCK_ONCE_LABEL,
      repeating: repeatingLabel,
    },
    ...overrides,
  });

describe(toLivePricingCard, () => {
  it.each([
    {
      case: 'the euro price for a euro visitor',
      currency: BILLING_CURRENCY.EUR,
      expected: format(MOCK_EURO_AMOUNT, BILLING_CURRENCY.EUR),
    },
    {
      case: 'the dollar price for a dollar visitor',
      currency: BILLING_CURRENCY.USD,
      expected: format(MOCK_DOLLAR_AMOUNT, BILLING_CURRENCY.USD),
    },
    {
      case: 'the default currency when the plan has no price in the visitor currency',
      currency: BILLING_CURRENCY.GBP,
      expected: format(MOCK_DOLLAR_AMOUNT, BILLING_CURRENCY.USD),
    },
  ])('heads the card with $case', ({ currency, expected }) => {
    const { headline } = setup({ currency });

    expect(headline?.amount).toBe(expected);
    expect(headline?.compareAt).toBeUndefined();
    expect(headline?.period).toBe(mockLivePlanPrice().period);
  });

  it('shows the discounted price beside the full one for a percent-off code', () => {
    const { headline } = setup({
      discount: mockPromotionDiscount({ percentOff: MOCK_PERCENT_OFF }),
    });
    const discounted = percentOffUnitAmount(
      MOCK_DOLLAR_AMOUNT,
      MOCK_PERCENT_OFF,
    );

    expect(headline?.amount).toBe(format(discounted, BILLING_CURRENCY.USD));
    expect(headline?.compareAt).toEqual({
      amount: format(MOCK_DOLLAR_AMOUNT, BILLING_CURRENCY.USD),
      label: compareAtLabel,
    });
  });

  it('takes an amount-off code off in the shown currency', () => {
    const { headline } = setup({
      currency: BILLING_CURRENCY.EUR,
      discount: mockPromotionDiscount({
        amountOffByCurrency: { [BILLING_CURRENCY.EUR]: MOCK_AMOUNT_OFF },
      }),
    });

    expect(headline?.amount).toBe(
      format(MOCK_EURO_AMOUNT - MOCK_AMOUNT_OFF, BILLING_CURRENCY.EUR),
    );
  });

  it('shows Free when an amount-off code covers the whole price', () => {
    const { headline } = setup({
      discount: mockPromotionDiscount({
        amountOffByCurrency: {
          [BILLING_CURRENCY.USD]: MOCK_DOLLAR_AMOUNT + MOCK_AMOUNT_OFF,
        },
      }),
    });

    expect(headline?.amount).toBe(free);
  });

  it.each([
    {
      case: 'an amount-off code without the shown currency',
      discount: mockPromotionDiscount({
        amountOffByCurrency: { [BILLING_CURRENCY.EUR]: MOCK_AMOUNT_OFF },
      }),
    },
    {
      case: 'a code for other products',
      discount: mockPromotionDiscount({
        percentOff: MOCK_PERCENT_OFF,
        appliesToProductIds: [MOCK_OTHER_PRODUCT_ID],
      }),
    },
  ])('keeps the full price and plain actions for $case', ({ discount }) => {
    const { headline, ctaButtons } = setup({ discount });

    expect(headline?.amount).toBe(
      format(MOCK_DOLLAR_AMOUNT, BILLING_CURRENCY.USD),
    );
    expect(headline?.compareAt).toBeUndefined();
    expect(ctaButtons).toEqual([MOCK_CTA_PRIMARY_ACTION]);
  });

  it('applies a code limited to the plan product', () => {
    const { headline } = setup({
      discount: mockPromotionDiscount({
        percentOff: MOCK_PERCENT_OFF,
        appliesToProductIds: [MOCK_STRIPE_PRODUCT_ID],
      }),
    });

    expect(headline?.compareAt).toBeDefined();
  });

  it.each([
    {
      duration: STRIPE_COUPON_DURATION.ONCE,
      durationInMonths: undefined,
      expected: [MOCK_ONCE_LABEL],
    },
    {
      duration: STRIPE_COUPON_DURATION.REPEATING,
      durationInMonths: MOCK_DURATION_IN_MONTHS,
      expected: [repeatingLabel(MOCK_DURATION_IN_MONTHS)],
    },
    {
      duration: STRIPE_COUPON_DURATION.FOREVER,
      durationInMonths: undefined,
      expected: [],
    },
  ])(
    'says how long a $duration discount lasts',
    ({ duration, durationInMonths, expected }) => {
      const { extras } = setup({
        discount: mockPromotionDiscount({
          percentOff: MOCK_PERCENT_OFF,
          duration,
          durationInMonths,
        }),
      });

      expect(extras).toEqual(expected);
    },
  );

  it('carries the code into the tier actions', () => {
    const { ctaButtons } = setup({
      discount: mockPromotionDiscount({ percentOff: MOCK_PERCENT_OFF }),
    });

    expect(ctaButtons[0]?.link.href).toContain(
      `${PRICING_SEARCH_PARAM.PROMO}=${MOCK_PROMOTION_CODE}`,
    );
  });

  it('returns the card unchanged when the plan has no price at all', () => {
    const card = mockPricingCard();

    expect(setup({ card, livePrice: mockLivePlanPrice({ amounts: {} }) })).toBe(
      card,
    );
  });
});
