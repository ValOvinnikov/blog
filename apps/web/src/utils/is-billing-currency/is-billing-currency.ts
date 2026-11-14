import { BILLING_CURRENCY, type TBillingCurrency } from '@blog/db/constants';
import { isOneOf } from '@blog/utils/primitives';

const BILLING_CURRENCIES = Object.values(BILLING_CURRENCY);

export const isBillingCurrency = (value: unknown): value is TBillingCurrency =>
  isOneOf(BILLING_CURRENCIES, value);
