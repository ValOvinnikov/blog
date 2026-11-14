import type { TMaybeUndefined } from '@blog/config';
import { BILLING_CURRENCY, type TBillingCurrency } from '@blog/db/constants';
import { isOneOf } from '@blog/utils/primitives';
import { readCookie } from '@web/utils/read-cookie';

export const CURRENCY_COOKIE_NAME = 'visitor_currency';

export const readCurrencyCookie = (
  cookieString: string,
): TMaybeUndefined<TBillingCurrency> => {
  const value = readCookie(cookieString, CURRENCY_COOKIE_NAME);
  return isOneOf(Object.values(BILLING_CURRENCY), value) ? value : undefined;
};
