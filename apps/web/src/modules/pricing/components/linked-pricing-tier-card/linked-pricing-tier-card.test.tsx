import { HTTP_STATUS, SITE_MESSAGES } from '@blog/config';
import { BILLING_CURRENCY } from '@blog/db/constants';
import {
  MOCK_DOLLAR_AMOUNT,
  MOCK_EURO_AMOUNT,
  MOCK_PERCENT_OFF,
  MOCK_PROMOTION_CODE,
} from '@blog/db/testing/stripe-catalogue/fixtures';
import { isUndefined } from '@blog/utils/primitives';
import { PRICING_LOG, PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { PromotionCodeProvider } from '@web/context/promotion-code-provider';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CTA_PRIMARY_ACTION } from '@web/testing/modules/cta/fixtures';
import { mockPricingCard } from '@web/testing/modules/pricing/fixtures';
import {
  mockLivePlanPrice,
  mockPromotionDiscount,
} from '@web/testing/modules/pricing/live-price-fixtures';
import { CURRENCY_COOKIE_NAME } from '@web/utils/currency-cookie';
import { reportClientError } from '@web/utils/report-client-error';

import {
  LinkedPricingTierCard,
  type ILinkedPricingTierCardProps,
} from './linked-pricing-tier-card';

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: vi.fn(),
}));

const MINOR_UNITS = 100;
const MOCK_LOCALE = 'en';

const format = (unitAmount: number, currency: string) =>
  new Intl.NumberFormat(MOCK_LOCALE, {
    style: 'currency',
    currency,
    trailingZeroDisplay: 'stripIfInteger',
  }).format(unitAmount / MINOR_UNITS);

const MOCK_FULL_DOLLAR_PRICE = format(MOCK_DOLLAR_AMOUNT, BILLING_CURRENCY.USD);

const LinkedCardWithPromotion = (props: ILinkedPricingTierCardProps) => (
  <PromotionCodeProvider>
    <LinkedPricingTierCard {...props} />
  </PromotionCodeProvider>
);

const setup = customRender(LinkedCardWithPromotion, {
  card: mockPricingCard({ ctaButtons: [MOCK_CTA_PRIMARY_ACTION] }),
  livePrice: mockLivePlanPrice(),
});

const respondWith = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(isUndefined(body) ? null : JSON.stringify(body), {
      status,
    }),
  );

describe(`<${LinkedPricingTierCard.name}/>`, () => {
  afterEach(() => {
    document.cookie = `${CURRENCY_COOKIE_NAME}=; max-age=0`;
    window.history.replaceState(null, '', '/');
    vi.unstubAllGlobals();
  });

  it('shows the default currency price without a currency cookie', () => {
    setup();

    const price = screen.getByText(MOCK_FULL_DOLLAR_PRICE);

    expect(price).toBeVisible();
  });

  it('shows the price in the currency the cookie remembers', () => {
    document.cookie = `${CURRENCY_COOKIE_NAME}=${BILLING_CURRENCY.EUR}`;

    setup();

    const price = screen.getByText(
      format(MOCK_EURO_AMOUNT, BILLING_CURRENCY.EUR),
    );

    expect(price).toBeVisible();
  });

  describe('with a promo code in the address', () => {
    beforeEach(() => {
      window.history.replaceState(
        null,
        '',
        `/?${PRICING_SEARCH_PARAM.PROMO}=${MOCK_PROMOTION_CODE}`,
      );
    });

    it('shows the discounted price beside the full one for a valid code', async () => {
      vi.stubGlobal(
        'fetch',
        respondWith(
          HTTP_STATUS.OK,
          mockPromotionDiscount({ percentOff: MOCK_PERCENT_OFF }),
        ),
      );
      const discounted = Math.round(
        MOCK_DOLLAR_AMOUNT * (1 - MOCK_PERCENT_OFF / MINOR_UNITS),
      );

      setup();

      const discountedPrice = await screen.findByText(
        format(discounted, BILLING_CURRENCY.USD),
      );
      const fullPrice = screen.getByText(MOCK_FULL_DOLLAR_PRICE);
      const action = screen.getByRole('link', {
        name: MOCK_CTA_PRIMARY_ACTION.link.label,
      });

      expect(discountedPrice).toBeVisible();
      expect(fullPrice).toBeVisible();
      expect(action).toHaveAttribute(
        'href',
        expect.stringContaining(
          `${PRICING_SEARCH_PARAM.PROMO}=${MOCK_PROMOTION_CODE}`,
        ),
      );
    });

    it('keeps the full price for an expired code', async () => {
      const fetchMock = respondWith(HTTP_STATUS.NOT_FOUND);
      vi.stubGlobal('fetch', fetchMock);

      setup();

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const fullPrice = screen.getByText(MOCK_FULL_DOLLAR_PRICE);
      const compareAtLabel = screen.queryByText(
        SITE_MESSAGES.pricingModule.compareAtLabel,
      );

      expect(fullPrice).toBeVisible();
      expect(compareAtLabel).not.toBeInTheDocument();
      expect(vi.mocked(reportClientError)).not.toHaveBeenCalled();
    });

    it('reports a failed lookup and keeps the full price', async () => {
      vi.stubGlobal('fetch', respondWith(HTTP_STATUS.INTERNAL_SERVER_ERROR));

      setup();

      await vi.waitFor(() =>
        expect(vi.mocked(reportClientError)).toHaveBeenCalledWith(
          PRICING_LOG.PROMOTION_CODE_FETCH_FAILED,
          expect.any(Error),
        ),
      );
      const fullPrice = screen.getByText(MOCK_FULL_DOLLAR_PRICE);

      expect(fullPrice).toBeVisible();
    });
  });

  it('refuses to render outside its promotion code provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      customRender(LinkedPricingTierCard, {
        card: mockPricingCard(),
        livePrice: mockLivePlanPrice(),
      })(),
    ).toThrow('usePromotionCode must be used within a PromotionCodeProvider');
  });
});
