import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  mockPricingModule,
  mockPricingPrice,
  mockPricingTier,
} from '@web/testing/modules/pricing/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PricingModule } from './pricing-module';

const { getPricingModuleMock, getSiteSettingsMock } = vi.hoisted(() => ({
  getPricingModuleMock: vi.fn(),
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: { pricing: { v1: { getPricingModule: getPricingModuleMock } } },
    global: { siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } } },
  },
}));

vi.mock('@web/server/request-context/request-context');

const setup = customRenderAsync(PricingModule, {
  id: 'pricing-1',
});

describe(`<${PricingModule.name}/>`, () => {
  beforeEach(() => {
    getPricingModuleMock.mockReset();
    getSiteSettingsMock.mockReset();
    getSiteSettingsMock.mockResolvedValue(okResult({ currency: 'GBP' }));
  });

  it('renders nothing when the module fetch fails', async () => {
    getPricingModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  describe('with a default pricing module', () => {
    beforeEach(() => {
      getPricingModuleMock.mockResolvedValue(okResult(mockPricingModule()));
    });

    it('fetches the module with the tenant Sanity context', async () => {
      await setup();

      expect(getPricingModuleMock).toHaveBeenCalledWith(
        'pricing-1',
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders nothing when the site settings fetch fails', async () => {
      getSiteSettingsMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });
  });

  it('formats prices in the site currency without trailing zeros', async () => {
    getPricingModuleMock.mockResolvedValue(
      okResult(
        mockPricingModule({
          tiers: [
            mockPricingTier({
              id: 'whole',
              name: 'Whole',
              prices: [mockPricingPrice({ amount: 49 })],
            }),
            mockPricingTier({
              id: 'fraction',
              name: 'Fraction',
              prices: [mockPricingPrice({ amount: 49.99 })],
            }),
            mockPricingTier({
              id: 'free',
              name: 'Free tier',
              prices: [mockPricingPrice({ amount: 0 })],
            }),
          ],
        }),
      ),
    );

    await setup();

    const wholePrice = screen.getByText('£49');
    const fractionPrice = screen.getByText('£49.99');
    const freePrice = screen.getByText('Free');
    expect(wholePrice).toBeVisible();
    expect(fractionPrice).toBeVisible();
    expect(freePrice).toBeVisible();
  });
});
