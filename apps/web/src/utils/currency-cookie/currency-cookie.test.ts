import { BILLING_CURRENCY } from '@blog/db/constants';
import { MOCK_UNLISTED_CURRENCY } from '@web/testing/modules/pricing/live-price-fixtures';

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
      cookies: `${CURRENCY_COOKIE_NAME}=${MOCK_UNLISTED_CURRENCY}`,
      expected: undefined,
    },
    { case: 'no currency cookie', cookies: '', expected: undefined },
  ])('reads $expected from $case', ({ cookies, expected }) => {
    expect(readCurrencyCookie(cookies)).toBe(expected);
  });
});
