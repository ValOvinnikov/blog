import { SITE_MESSAGES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  mockPricingModule,
  mockPricingPrice,
  mockPricingTier,
} from '@web/testing/modules/pricing/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

faker.seed(13);

const MOCK_PRICING_MODULE_ID = faker.string.uuid();

const setup = customRenderAsync(PricingModule, {
  id: MOCK_PRICING_MODULE_ID,
});

describe(`<${PricingModule.name}/>`, () => {
  beforeEach(() => {
    getPricingModuleMock.mockReset();
    getPricingModuleMock.mockResolvedValue(okResult(mockPricingModule()));
  });

  it('fetches the module with the tenant Sanity context', async () => {
    await setup();

    expect(getPricingModuleMock).toHaveBeenCalledWith(
      MOCK_PRICING_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the module fetch fails', async () => {
    getPricingModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the site settings fetch fails', async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
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
});
