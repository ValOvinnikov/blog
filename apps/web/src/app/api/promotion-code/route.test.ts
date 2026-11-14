import { HTTP_STATUS } from '@blog/config/constants';
import {
  MOCK_PERCENT_OFF,
  MOCK_PROMOTION_CODE,
} from '@blog/db/testing/stripe-catalogue/fixtures';
import { isUndefined } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import { CACHE_CONTROL } from '@web/constants/http';
import { PRICING_LOG, PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { mockPromotionDiscount } from '@web/testing/modules/pricing/live-price-fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';

import { GET } from './route';

const { getActiveStripePromotionCodeMock } = vi.hoisted(() => ({
  getActiveStripePromotionCodeMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    stripeCatalogue: {
      getActiveStripePromotionCode: getActiveStripePromotionCodeMock,
    },
  },
}));

faker.seed(6882);

const MOCK_BASE_URL = faker.internet.url({ appendSlash: false });
const MOCK_TOO_LONG_CODE = faker.string.alpha(65);

const requestFor = (code?: string) => {
  const url = new URL('/api/promotion-code', MOCK_BASE_URL);
  if (!isUndefined(code)) {
    url.searchParams.set(PRICING_SEARCH_PARAM.PROMO, code);
  }
  return new Request(url);
};

describe(GET, () => {
  beforeEach(() => {
    getActiveStripePromotionCodeMock.mockReset();
  });

  it("returns only the active code's discount, cached publicly", async () => {
    getActiveStripePromotionCodeMock.mockResolvedValue({
      ...mockPromotionDiscount({ percentOff: MOCK_PERCENT_OFF }),
      expiresAt: faker.date.future(),
    });

    const response = await GET(requestFor(MOCK_PROMOTION_CODE));

    expect(getActiveStripePromotionCodeMock).toHaveBeenCalledWith(
      MOCK_PROMOTION_CODE,
    );
    expect(response.headers.get('Cache-Control')).toBe(
      CACHE_CONTROL.PUBLIC_ONE_MINUTE,
    );
    expect(await response.json()).toEqual({
      code: MOCK_PROMOTION_CODE,
      percentOff: MOCK_PERCENT_OFF,
      duration: mockPromotionDiscount().duration,
    });
  });

  it('answers 404 for an unknown or expired code', async () => {
    getActiveStripePromotionCodeMock.mockResolvedValue(undefined);

    const response = await GET(requestFor(MOCK_PROMOTION_CODE));

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it.each([
    { case: 'no code', code: undefined },
    { case: 'a blank code', code: ' ' },
    { case: 'an overlong code', code: MOCK_TOO_LONG_CODE },
  ])('answers 400 for $case without a lookup', async ({ code }) => {
    const response = await GET(requestFor(code));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(getActiveStripePromotionCodeMock).not.toHaveBeenCalled();
  });

  it('logs and answers 500 when the lookup fails', async () => {
    getActiveStripePromotionCodeMock.mockRejectedValue(MOCK_ERROR);

    const response = await GET(requestFor(MOCK_PROMOTION_CODE));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      PRICING_LOG.PROMOTION_CODE_LOOKUP_FAILED,
      { code: MOCK_PROMOTION_CODE, error: MOCK_ERROR },
    );
  });
});
