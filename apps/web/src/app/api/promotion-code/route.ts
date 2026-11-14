import { HTTP_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import { CACHE_CONTROL } from '@web/constants/http';
import { PRICING_LOG, PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { logger } from '@web/utils/logger/logger';
import type { TPromotionDiscount } from '@web/utils/promotion-discount';
import { NextResponse } from 'next/server';

const MAX_CODE_LENGTH = 64;

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': CACHE_CONTROL.PUBLIC_ONE_MINUTE,
};

const emptyResponse = (status: number) =>
  new NextResponse(null, { status, headers: PUBLIC_CACHE_HEADERS });

export async function GET(request: Request): Promise<NextResponse> {
  const code = new URL(request.url).searchParams
    .get(PRICING_SEARCH_PARAM.PROMO)
    ?.trim();
  if (!code || code.length > MAX_CODE_LENGTH) {
    return emptyResponse(HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const promotionCode =
      await queries.stripeCatalogue.getActiveStripePromotionCode(code);
    if (!promotionCode) return emptyResponse(HTTP_STATUS.NOT_FOUND);

    const {
      percentOff,
      amountOffByCurrency,
      duration,
      durationInMonths,
      appliesToProductIds,
    } = promotionCode;
    const discount: TPromotionDiscount = {
      code: promotionCode.code,
      percentOff,
      amountOffByCurrency,
      duration,
      durationInMonths,
      appliesToProductIds,
    };
    return NextResponse.json(discount, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    logger.error(PRICING_LOG.PROMOTION_CODE_LOOKUP_FAILED, { code, error });
    return new NextResponse(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
