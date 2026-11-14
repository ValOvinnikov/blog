import { BILLING_CURRENCY } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { COUNTRY_CODE } from '@web/constants/country';
import { CURRENCY_COOKIE_NAME } from '@web/utils/currency-cookie';
import { NextRequest, NextResponse } from 'next/server';

import {
  rememberVisitorCurrency,
  VISITOR_COUNTRY_HEADER,
} from './remember-visitor-currency';

faker.seed(6882);

const MOCK_URL = faker.internet.url();
const MOCK_UNLISTED_COUNTRY = 'JP';

const setup = (country?: string, remembered?: string) => {
  const headers = new Headers();
  if (country) headers.set(VISITOR_COUNTRY_HEADER, country);
  if (remembered)
    headers.set('cookie', `${CURRENCY_COOKIE_NAME}=${remembered}`);
  const response = NextResponse.next();
  rememberVisitorCurrency(new NextRequest(MOCK_URL, { headers }), response);
  return response.cookies.get(CURRENCY_COOKIE_NAME);
};

describe(rememberVisitorCurrency, () => {
  it.each([
    { country: COUNTRY_CODE.DE, expected: BILLING_CURRENCY.EUR },
    { country: COUNTRY_CODE.BG, expected: BILLING_CURRENCY.EUR },
    { country: COUNTRY_CODE.US, expected: BILLING_CURRENCY.USD },
    { country: COUNTRY_CODE.GB, expected: BILLING_CURRENCY.GBP },
  ])(
    'remembers $expected for a visitor from $country',
    ({ country, expected }) => {
      expect(setup(country)?.value).toBe(expected);
    },
  );

  it('sets nothing when the remembered currency already matches', () => {
    expect(setup(COUNTRY_CODE.FR, BILLING_CURRENCY.EUR)).toBeUndefined();
  });

  it('sets nothing without the country header', () => {
    expect(setup()).toBeUndefined();
  });

  it('forgets a remembered currency for a country with no listed currency', () => {
    expect(setup(MOCK_UNLISTED_COUNTRY, BILLING_CURRENCY.USD)?.value).toBe('');
  });

  it('sets nothing for a country with no listed currency and none remembered', () => {
    expect(setup(MOCK_UNLISTED_COUNTRY)).toBeUndefined();
  });
});
