import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroStatementModule } from './hero-statement-module';

const { getHeroStatementMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getHeroStatementMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroStatement: { v1: { getHeroStatement: getHeroStatementMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const makeHeroStatementData = (overrides: Record<string, unknown> = {}) => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Build faster, ship sooner',
  supportingText: undefined,
  sanityImage: undefined,
  actions: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(HeroStatementModule, {
  id: 'hero-statement-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${HeroStatementModule.name}/>`, () => {
  beforeEach(() => {
    getHeroStatementMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getHeroStatement', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getHeroStatementMock.mockResolvedValue({
      ok: true,
      data: makeHeroStatementData(),
    });

    await setup();

    expect(getHeroStatementMock).toHaveBeenCalledWith(
      'hero-statement-1',
      tenant,
    );
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroStatementMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroStatementMock.mockResolvedValue({
      ok: true,
      data: makeHeroStatementData({ heading: 'Hello World' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders the hero image src from the configured Sanity CDN base URL, not a hardcoded origin', async () => {
    const sanityImage = makeSanityImage();
    getHeroStatementMock.mockResolvedValue({
      ok: true,
      data: makeHeroStatementData({ sanityImage }),
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(
      img.getAttribute('src')?.startsWith(STATIC_SANITY_IMAGE_BASE_URL),
    ).toBe(true);
  });
});
