import type { TMoveUpQuote } from '@platform/server/billing/get-move-up-quote-action';
import { toStripeTime } from '@platform/server/billing/stripe-time';
import {
  MOCK_BAND_2500_AMOUNT,
  MOCK_GROWTH_MONTHLY_AMOUNT,
} from '@platform/testing/billing/catalogue-prices';
import {
  MOCK_AMOUNT_PAID,
  MOCK_BAND_CEILING,
} from '@platform/testing/billing/fixtures';
import { MOCK_RENEWS_AT } from '@platform/testing/billing/plan-subscription';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import { BILLING_INTERVAL, TENANT_PLAN } from '@shinefold/config/constants';
import { BILLING_CURRENCY } from '@shinefold/db/constants';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';

export const MOCK_CARD_LAST4 = '4242';

export const MOCK_MOVE_UP_OFFER: TMoveUpOffer = {
  ceiling: MOCK_BAND_CEILING,
  allowance: monthlySendAllowance(TENANT_PLAN.GROWTH, MOCK_BAND_CEILING),
  interval: BILLING_INTERVAL.MONTHLY,
  extra: { minorUnits: MOCK_BAND_2500_AMOUNT, currency: BILLING_CURRENCY.USD },
};

export const MOCK_MOVE_UP_QUOTE: TMoveUpQuote = {
  dueToday: { minorUnits: MOCK_AMOUNT_PAID, currency: BILLING_CURRENCY.USD },
  prorationDate: toStripeTime(MOCK_RENEWS_AT),
  renewsAt: MOCK_RENEWS_AT,
  total: {
    minorUnits: MOCK_GROWTH_MONTHLY_AMOUNT + MOCK_BAND_2500_AMOUNT,
    currency: BILLING_CURRENCY.USD,
  },
  card: { brand: 'visa', last4: MOCK_CARD_LAST4 },
};
