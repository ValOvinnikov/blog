import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroStatementModule } from './hero-statement-module';

const { getHeroStatementMock } = vi.hoisted(() => ({
  getHeroStatementMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroStatement: { v1: { getHeroStatement: getHeroStatementMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const makeHeroStatementData = (overrides: Record<string, unknown> = {}) => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Build faster, ship sooner' }),
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(HeroStatementModule, {
  id: 'hero-statement-1',
});

describe(`<${HeroStatementModule.name}/>`, () => {
  beforeEach(() => {
    getHeroStatementMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getHeroStatement', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getHeroStatementMock.mockResolvedValue({
      ok: true,
      data: makeHeroStatementData(),
    });

    await setup();

    expect(getHeroStatementMock).toHaveBeenCalledWith(
      'hero-statement-1',
      tenant,
    );
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
      data: makeHeroStatementData({
        headingBlock: makeHeadingBlock({ heading: 'Hello World' }),
      }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders the hero image src from the configured Sanity CDN base URL', async () => {
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
