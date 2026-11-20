import type { TMoveUpQuote } from '@platform/server/billing/get-move-up-quote-action';
import {
  MOCK_BAND_2500_AMOUNT,
  MOCK_GROWTH_MONTHLY_AMOUNT,
} from '@platform/testing/billing/catalogue-prices';
import { MOCK_AMOUNT_PAID } from '@platform/testing/billing/fixtures';
import { MOCK_RENEWS_AT } from '@platform/testing/billing/plan-subscription';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import { BILLING_INTERVAL } from '@shinefold/config/constants';
import { BILLING_CURRENCY } from '@shinefold/db/constants';

export const MOCK_CARD_LAST4 = '4242';

export const MOCK_MOVE_UP_OFFER: TMoveUpOffer = {
  ceiling: 2_500,
  allowance: 15_000,
  interval: BILLING_INTERVAL.MONTHLY,
  extra: { minorUnits: MOCK_BAND_2500_AMOUNT, currency: BILLING_CURRENCY.USD },
};

export const MOCK_MOVE_UP_QUOTE: TMoveUpQuote = {
  dueToday: { minorUnits: MOCK_AMOUNT_PAID, currency: BILLING_CURRENCY.USD },
  renewsAt: MOCK_RENEWS_AT,
  total: {
    minorUnits: MOCK_GROWTH_MONTHLY_AMOUNT + MOCK_BAND_2500_AMOUNT,
    currency: BILLING_CURRENCY.USD,
  },
  card: { brand: 'visa', last4: MOCK_CARD_LAST4 },
};
