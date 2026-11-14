import { BILLING_CURRENCY } from '@blog/db/constants';

import { CURRENCY_COOKIE_NAME, readCurrencyCookie } from './currency-cookie';

describe(readCurrencyCookie, () => {
  it.each([
    {
      case: 'a billing currency',
      cookies: `${CURRENCY_COOKIE_NAME}=${BILLING_CURRENCY.EUR}`,
      expected: BILLING_CURRENCY.EUR,
    },
    {
      case: 'an unknown currency',
      cookies: `${CURRENCY_COOKIE_NAME}=JPY`,
      expected: undefined,
    },
    { case: 'no currency cookie', cookies: '', expected: undefined },
  ])('reads $expected from $case', ({ cookies, expected }) => {
    expect(readCurrencyCookie(cookies)).toBe(expected);
  });
});
