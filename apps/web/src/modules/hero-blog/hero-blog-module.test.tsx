import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroBlogModule } from './hero-blog-module';

const { getHeroBlogMock, getTenantSanityContextMock, loggerErrorMock } =
  vi.hoisted(() => ({
    getHeroBlogMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
    loggerErrorMock: vi.fn(),
  }));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroBlog: { v1: { getHeroBlog: getHeroBlogMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const makeHeroBlogData = (overrides: Record<string, unknown> = {}) => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Welcome',
  supportingText: undefined,
  sanityImage: undefined,
  primaryAction: undefined,
  secondaryAction: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(HeroBlogModule, {
  id: 'hero-blog-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${HeroBlogModule.name}/>`, () => {
  beforeEach(() => {
    getHeroBlogMock.mockReset();
    getTenantSanityContextMock.mockReset();
    loggerErrorMock.mockClear();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getHeroBlog', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData(),
    });

    await setup();

    expect(getHeroBlogMock).toHaveBeenCalledWith('hero-blog-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroBlogMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ heading: 'Hello World' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('logs and renders nothing when the resolved post no longer exists (unfeatured, unpublished, or deleted after publish)', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ heading: undefined }),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'hero_blog_module.post_unresolved',
      { id: 'hero-blog-1' },
    );
  });

  it('renders the hero image using its own cdnBaseUrl, not a hardcoded origin', async () => {
    const sanityImage = makeSanityImage({
      cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-project/production/',
    });
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ sanityImage }),
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('tenant-project/production');
  });
});
