import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModule } from './hero-module';

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

const setup = customRenderAsync(HeroModule, { id: 'hero-1', locale: 'en' });

describe(HeroModule, () => {
  beforeEach(() => {
    getHeroMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('forwards the resolved tenant Sanity context to getHero', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
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

    expect(getHeroMock).toHaveBeenCalledWith('hero-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no title resolves (POST mode, no configured or fallback featured post)', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: undefined,
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    const { container } = await setup();

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the hero image using its own cdnBaseUrl, not a hardcoded origin', async () => {
    const sanityImage = makeSanityImage({
      cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-project/production/',
    });
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('tenant-project/production');
  });
});
