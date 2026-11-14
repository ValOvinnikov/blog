'use client';

import { HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import { PRICING_LOG, PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { useClientSnapshot } from '@web/hooks/use-client-snapshot';
import {
  PROMOTION_CODE_PATH,
  promotionDiscountSchema,
  type TPromotionDiscount,
} from '@web/utils/promotion-discount';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useState } from 'react';

const readPromoParam = (): TMaybeUndefined<string> =>
  new URLSearchParams(window.location.search).get(PRICING_SEARCH_PARAM.PROMO) ??
  undefined;

const fetchPromotionDiscount = async (
  code: string,
): Promise<TMaybeUndefined<TPromotionDiscount>> => {
  const query = new URLSearchParams({ [PRICING_SEARCH_PARAM.PROMO]: code });
  const response = await fetch(`${PROMOTION_CODE_PATH}?${query}`);
  if (response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    throw new Error(`Promotion code lookup answered ${response.status}`);
  }
  if (!response.ok) return undefined;
  const parsed = promotionDiscountSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : undefined;
};

export const usePromotionDiscount = (): TMaybeUndefined<TPromotionDiscount> => {
  const code = useClientSnapshot(readPromoParam, undefined);
  const [discount, setDiscount] =
    useState<TMaybeUndefined<TPromotionDiscount>>(undefined);

  useEffect(() => {
    if (!code) return;
    let isCancelled = false;

    fetchPromotionDiscount(code)
      .then((result) => {
        if (!isCancelled) setDiscount(result);
      })
      .catch((error: unknown) => {
        reportClientError(PRICING_LOG.PROMOTION_CODE_FETCH_FAILED, error);
      });

    return () => {
      isCancelled = true;
    };
  }, [code]);

  return code ? discount : undefined;
};
