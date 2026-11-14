import type { TMaybeUndefined } from '@blog/config';
import type { TBillingCurrency } from '@blog/db/constants';
import { isBillingCurrency } from '@web/utils/is-billing-currency';
import { readCookie } from '@web/utils/read-cookie';

export const CURRENCY_COOKIE_NAME = 'visitor_currency';

export const readCurrencyCookie = (
  cookieString: string,
): TMaybeUndefined<TBillingCurrency> => {
  const value = readCookie(cookieString, CURRENCY_COOKIE_NAME);
  return isBillingCurrency(value) ? value : undefined;
};
