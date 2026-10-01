import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  makePricingModule,
  makePricingPrice,
  makePricingTier,
} from '@web/testing/modules/pricing/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

vi.mock('@web/server/tenant/get-tenant-sanity-context');

const getTenantSanityContextMock = vi.mocked(getTenantSanityContext);

const setup = customRenderAsync(PricingModule, {
  id: 'pricing-1',
  locale: 'en-GB',
  tenant: 'tenant-1',
});

describe(`<${PricingModule.name}/>`, () => {
  beforeEach(() => {
    getPricingModuleMock.mockReset();
    getSiteSettingsMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { currency: 'GBP' },
    });
  });

  it('calls getPricingModule with the module id and the tenant Sanity context', async () => {
    getPricingModuleMock.mockResolvedValue({
      ok: true,
      data: makePricingModule(),
    });

    await setup();

    expect(getPricingModuleMock).toHaveBeenCalledWith(
      'pricing-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the module fetch fails', async () => {
    getPricingModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the site settings fetch fails', async () => {
    getPricingModuleMock.mockResolvedValue({
      ok: true,
      data: makePricingModule(),
    });
    getSiteSettingsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('formats prices in the site currency without trailing zeros', async () => {
    getPricingModuleMock.mockResolvedValue({
      ok: true,
      data: makePricingModule({
        tiers: [
          makePricingTier({
            id: 'whole',
            name: 'Whole',
            prices: [makePricingPrice({ amount: 49 })],
          }),
          makePricingTier({
            id: 'fraction',
            name: 'Fraction',
            prices: [makePricingPrice({ amount: 49.99 })],
          }),
          makePricingTier({
            id: 'free',
            name: 'Free tier',
            prices: [makePricingPrice({ amount: 0 })],
          }),
        ],
      }),
    });

    await setup();

    expect(screen.getByText('£49')).toBeVisible();
    expect(screen.getByText('£49.99')).toBeVisible();
    expect(screen.getByText('Free')).toBeVisible();
  });
});
