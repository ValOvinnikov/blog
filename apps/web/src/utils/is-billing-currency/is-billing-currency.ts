import {
  BILLING_CURRENCY,
  type TBillingCurrency,
} from '@shinefold/db/constants';
import { isOneOf } from '@shinefold/utils/primitives';

const BILLING_CURRENCIES = Object.values(BILLING_CURRENCY);

export const isBillingCurrency = (value: unknown): value is TBillingCurrency =>
  isOneOf(BILLING_CURRENCIES, value);
