import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroSlot } from './hero-slot';

const { getHeroMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getHeroMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      hero: { v1: { getHero: getHeroMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const setup = customRenderAsync(HeroSlot, {
  id: 'hero-1',
  type: 'module_hero',
  locale: 'en',
  tenant: 'tenant-1',
});

describe('HERO_MAP', () => {
  beforeEach(() => {
    getHeroMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('dispatches module_hero through the real registry to the real HeroModule', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: 'Welcome',
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    await setup();

    expect(getHeroMock).toHaveBeenCalledWith(
      'hero-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeVisible();
  });
});
