'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import type { TBillingCurrency } from '@shinefold/db/constants';
import { PRICING_LOG } from '@web/constants/pricing';
import { reportClientError } from '@web/utils/report-client-error';
import {
  VISITOR_CURRENCY_PATH,
  visitorCurrencySchema,
} from '@web/utils/visitor-currency';
import { useEffect, useState } from 'react';

const VISITOR_CURRENCY_TIMEOUT_MS = 3000;

type TVisitorCurrencyRequest = Promise<TMaybeUndefined<TBillingCurrency>>;

let visitorCurrencyRequest: TMaybeUndefined<TVisitorCurrencyRequest>;

const fetchVisitorCurrency = async (): TVisitorCurrencyRequest => {
  const response = await fetch(VISITOR_CURRENCY_PATH, {
    signal: AbortSignal.timeout(VISITOR_CURRENCY_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Visitor currency lookup answered ${response.status}`);
  }
  return visitorCurrencySchema.parse(await response.json()).currency;
};

const requestVisitorCurrency = (): TVisitorCurrencyRequest => {
  visitorCurrencyRequest ??= fetchVisitorCurrency().catch((error: unknown) => {
    reportClientError(PRICING_LOG.VISITOR_CURRENCY_FETCH_FAILED, error);
    return undefined;
  });
  return visitorCurrencyRequest;
};

export const useVisitorCurrency = (
  defaultCurrency: TBillingCurrency,
): TMaybeUndefined<TBillingCurrency> => {
  const [currency, setCurrency] =
    useState<TMaybeUndefined<TBillingCurrency>>(undefined);

  useEffect(() => {
    let isCancelled = false;

    void requestVisitorCurrency().then((visitorCurrency) => {
      if (!isCancelled) setCurrency(visitorCurrency ?? defaultCurrency);
    });

    return () => {
      isCancelled = true;
    };
  }, [defaultCurrency]);

  return currency;
};
