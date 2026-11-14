import { PRICE_PERIOD, SITE_MESSAGES } from '@blog/config';
import { MOCK_DOLLAR_AMOUNT } from '@blog/db/testing/stripe-catalogue/fixtures';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { PRICING_LOG } from '@web/constants/pricing';
import { getPlanPrices } from '@web/server/pricing/get-plan-prices/get-plan-prices';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  mockPricingModule,
  mockPricingPrice,
  mockPricingTier,
} from '@web/testing/modules/pricing/fixtures';
import {
  mockStripePrice,
  formatMockUnitAmount,
  mockLinkedPricingTier,
} from '@web/testing/modules/pricing/live-price-fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { PricingModule } from './pricing-module';

const { getPricingModuleMock } = vi.hoisted(() => ({
  getPricingModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: { pricing: { v1: { getPricingModule: getPricingModuleMock } } },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

vi.mock('@web/server/pricing/get-plan-prices/get-plan-prices', () => ({
  getPlanPrices: vi.fn(),
}));

faker.seed(13);

const MOCK_PRICING_MODULE_ID = faker.string.uuid();
const MOCK_MONTH_WORDING = 'a month';
const MOCK_LINKED_MODULE = mockPricingModule({
  tiers: [mockLinkedPricingTier(PRICE_PERIOD.MONTH)],
});

const setup = customRenderAsync(PricingModule, {
  id: MOCK_PRICING_MODULE_ID,
});

describe(`<${PricingModule.name}/>`, () => {
  beforeEach(() => {
    getPricingModuleMock.mockReset();
    getPricingModuleMock.mockResolvedValue(okResult(mockPricingModule()));
    vi.mocked(getPlanPrices).mockReset();
    vi.mocked(getPlanPrices).mockResolvedValue(okResult([mockStripePrice()]));
  });

  describe('with the default module', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module with the tenant Sanity context', () => {
      expect(getPricingModuleMock).toHaveBeenCalledWith(
        MOCK_PRICING_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('shows the catalogue wording for a period the site leaves empty', () => {
      const period = screen.getByText(
        SITE_MESSAGES.pricingModule.period[PRICE_PERIOD.MONTH],
      );

      expect(period).toBeVisible();
    });
  });

  it('logs and renders nothing when the module fetch fails', async () => {
    getPricingModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      PRICING_LOG.MODULE_FETCH_FAILED,
      { id: MOCK_PRICING_MODULE_ID, error: MOCK_ERROR },
    );
  });

  it('logs and renders nothing when the site settings fetch fails', async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      PRICING_LOG.SITE_SETTINGS_FAILED,
      { id: MOCK_PRICING_MODULE_ID, error: MOCK_ERROR },
    );
  });

  it.each([
    {
      title: "the module's style overrides",
      overrides: MOCK_SECTION_STYLE_OVERRIDES,
    },
    { title: 'no overrides', overrides: MOCK_NO_SECTION_STYLE_OVERRIDES },
  ])('scopes the section to $title', async ({ overrides }) => {
    getPricingModuleMock.mockResolvedValue(
      okResult(mockPricingModule(overrides)),
    );

    await setup();

    expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
      overrides,
    );
  });

  it.each([
    { title: 'without trailing zeros', amount: 49, formatted: '£49' },
    { title: 'with its fraction', amount: 49.99, formatted: '£49.99' },
    {
      title: 'as free',
      amount: 0,
      formatted: SITE_MESSAGES.pricingModule.free,
    },
  ])(
    'formats a price of $amount in the site currency $title',
    async ({ amount, formatted }) => {
      getPricingModuleMock.mockResolvedValue(
        okResult(
          mockPricingModule({
            tiers: [
              mockPricingTier({
                prices: [mockPricingPrice({ amount })],
              }),
            ],
          }),
        ),
      );

      await setup();

      const price = screen.getByText(formatted);

      expect(price).toBeVisible();
    },
  );

  it("shows the site's wording for a period it sets", async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce(
      okResult({
        ...MOCK_SITE_SETTINGS,
        pricePeriodWording: {
          ...MOCK_SITE_SETTINGS.pricePeriodWording,
          [PRICE_PERIOD.MONTH]: MOCK_MONTH_WORDING,
        },
      }),
    );

    await setup();

    const period = screen.getByText(MOCK_MONTH_WORDING);

    expect(period).toBeVisible();
  });

  it('reads no plan prices when no tier links a platform plan', async () => {
    await setup();

    expect(vi.mocked(getPlanPrices)).not.toHaveBeenCalled();
  });

  describe('with a tier linked to a platform plan', () => {
    beforeEach(() => {
      getPricingModuleMock.mockResolvedValue(okResult(MOCK_LINKED_MODULE));
    });

    it("shows the tier's live price from the catalogue", async () => {
      await setup();

      const price = screen.getByText(
        formatMockUnitAmount(MOCK_DOLLAR_AMOUNT, mockStripePrice().currency),
      );

      expect(price).toBeVisible();
    });

    it('logs and still renders the tier when the plan prices fail', async () => {
      vi.mocked(getPlanPrices).mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const tierName = screen.getByText(mockPricingTier().name);

      expect(tierName).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        PRICING_LOG.PLAN_PRICES_FETCH_FAILED,
        { id: MOCK_PRICING_MODULE_ID, error: MOCK_ERROR },
      );
    });
  });
});
