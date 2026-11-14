import type { TMaybeUndefined } from '@blog/config';
import { BILLING_CURRENCY, type TBillingCurrency } from '@blog/db/constants';
import { COUNTRY_CODE } from '@web/constants/country';
import { CURRENCY_COOKIE_NAME } from '@web/utils/currency-cookie';
import { REMEMBERED_COOKIE_OPTIONS } from '@web/utils/remembered-cookie-options';
import type { NextRequest, NextResponse } from 'next/server';

export const VISITOR_COUNTRY_HEADER = 'x-vercel-ip-country';

const EURO_COUNTRIES = [
  COUNTRY_CODE.AD,
  COUNTRY_CODE.AT,
  COUNTRY_CODE.BE,
  COUNTRY_CODE.BG,
  COUNTRY_CODE.BL,
  COUNTRY_CODE.CY,
  COUNTRY_CODE.DE,
  COUNTRY_CODE.EE,
  COUNTRY_CODE.ES,
  COUNTRY_CODE.FI,
  COUNTRY_CODE.FR,
  COUNTRY_CODE.GF,
  COUNTRY_CODE.GP,
  COUNTRY_CODE.GR,
  COUNTRY_CODE.HR,
  COUNTRY_CODE.IE,
  COUNTRY_CODE.IT,
  COUNTRY_CODE.LT,
  COUNTRY_CODE.LU,
  COUNTRY_CODE.LV,
  COUNTRY_CODE.MC,
  COUNTRY_CODE.ME,
  COUNTRY_CODE.MF,
  COUNTRY_CODE.MQ,
  COUNTRY_CODE.MT,
  COUNTRY_CODE.NL,
  COUNTRY_CODE.PM,
  COUNTRY_CODE.PT,
  COUNTRY_CODE.RE,
  COUNTRY_CODE.SI,
  COUNTRY_CODE.SK,
  COUNTRY_CODE.SM,
  COUNTRY_CODE.VA,
  COUNTRY_CODE.XK,
  COUNTRY_CODE.YT,
];

const CURRENCY_BY_COUNTRY: Readonly<Record<string, TBillingCurrency>> = {
  ...Object.fromEntries(
    EURO_COUNTRIES.map((country) => [country, BILLING_CURRENCY.EUR]),
  ),
  [COUNTRY_CODE.US]: BILLING_CURRENCY.USD,
  [COUNTRY_CODE.GB]: BILLING_CURRENCY.GBP,
};

const currencyForCountry = (
  country: TMaybeUndefined<string>,
): TMaybeUndefined<TBillingCurrency> =>
  country ? CURRENCY_BY_COUNTRY[country.toUpperCase()] : undefined;

export const rememberVisitorCurrency = (
  request: NextRequest,
  response: NextResponse,
): void => {
  const country = request.headers.get(VISITOR_COUNTRY_HEADER);
  if (!country) return;

  const currency = currencyForCountry(country);
  const remembered = request.cookies.get(CURRENCY_COOKIE_NAME)?.value;
  if (currency === remembered) return;

  if (!currency) {
    response.cookies.delete(CURRENCY_COOKIE_NAME);
    return;
  }
  response.cookies.set(
    CURRENCY_COOKIE_NAME,
    currency,
    REMEMBERED_COOKIE_OPTIONS,
  );
};
