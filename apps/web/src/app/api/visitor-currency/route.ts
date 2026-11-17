import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  BILLING_CURRENCY,
  type TBillingCurrency,
} from '@shinefold/db/constants';
import { COUNTRY_CODE } from '@web/constants/country';
import { CACHE_CONTROL } from '@web/constants/http';
import {
  VISITOR_COUNTRY_HEADER,
  type TVisitorCurrency,
} from '@web/utils/visitor-currency';
import { NextResponse } from 'next/server';

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
  country: TMaybeNull<string>,
): TMaybeUndefined<TBillingCurrency> =>
  country ? CURRENCY_BY_COUNTRY[country.toUpperCase()] : undefined;

export function GET(request: Request): NextResponse<TVisitorCurrency> {
  const currency = currencyForCountry(
    request.headers.get(VISITOR_COUNTRY_HEADER),
  );
  return NextResponse.json(
    { currency },
    { headers: { 'Cache-Control': CACHE_CONTROL.PRIVATE_NO_STORE } },
  );
}
