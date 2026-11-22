import { faker } from '@faker-js/faker';
import { BILLING_CURRENCY } from '@shinefold/db/constants';
import { COUNTRY_CODE } from '@web/constants/country';
import { CACHE_CONTROL } from '@web/constants/http';
import { CACHE_CONTROL_HEADER } from '@web/testing/shared/http/constants';
import {
  VISITOR_COUNTRY_HEADER,
  VISITOR_CURRENCY_PATH,
} from '@web/utils/visitor-currency';

import { GET } from './route';

faker.seed(7468);

const MOCK_BASE_URL = faker.internet.url({ appendSlash: false });
const MOCK_UNLISTED_COUNTRY = 'JP';

const requestFrom = (country?: string) => {
  const headers = new Headers();
  if (country) headers.set(VISITOR_COUNTRY_HEADER, country);
  return new Request(new URL(VISITOR_CURRENCY_PATH, MOCK_BASE_URL), {
    headers,
  });
};

describe(GET, () => {
  it.each([
    { country: COUNTRY_CODE.DE, expected: BILLING_CURRENCY.EUR },
    { country: COUNTRY_CODE.BG, expected: BILLING_CURRENCY.EUR },
    { country: COUNTRY_CODE.RE, expected: BILLING_CURRENCY.EUR },
    { country: COUNTRY_CODE.US, expected: BILLING_CURRENCY.USD },
    { country: COUNTRY_CODE.GB, expected: BILLING_CURRENCY.GBP },
  ])(
    'answers $expected for a visitor from $country',
    async ({ country, expected }) => {
      const response = GET(requestFrom(country));

      expect(await response.json()).toEqual({ currency: expected });
    },
  );

  it('reads the country code case-insensitively', async () => {
    const response = GET(requestFrom(COUNTRY_CODE.GB.toLowerCase()));

    expect(await response.json()).toEqual({
      currency: BILLING_CURRENCY.GBP,
    });
  });

  it.each([
    {
      case: 'a country with no listed currency',
      country: MOCK_UNLISTED_COUNTRY,
    },
    { case: 'no country header', country: undefined },
  ])('answers no currency for $case', async ({ country }) => {
    const response = GET(requestFrom(country));

    expect(await response.json()).toEqual({});
  });

  it('is never cached by a browser or the CDN', () => {
    const response = GET(requestFrom(COUNTRY_CODE.US));

    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
      CACHE_CONTROL.PRIVATE_NO_STORE,
    );
  });
});
