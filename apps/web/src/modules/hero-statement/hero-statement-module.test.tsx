import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroStatementModule } from './hero-statement-module';

const MODULE_ID = 'hero-statement-1';
const STATEMENT = 'Hello World';

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
  id: MODULE_ID,
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
    getHeroStatementMock.mockResolvedValue(okResult(makeHeroStatementData()));

    await setup();

    expect(getHeroStatementMock).toHaveBeenCalledWith(MODULE_ID, tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroStatementMock.mockResolvedValue(errorResult(new Error('boom')));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroStatementMock.mockResolvedValue(
      okResult(
        makeHeroStatementData({
          headingBlock: makeHeadingBlock({ heading: STATEMENT }),
        }),
      ),
    );

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: STATEMENT }),
    ).toBeVisible();
  });

  it('renders the hero image src from the configured Sanity CDN base URL', async () => {
    const sanityImage = makeSanityImage();
    getHeroStatementMock.mockResolvedValue(
      okResult(makeHeroStatementData({ sanityImage })),
    );

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(
      img.getAttribute('src')?.startsWith(STATIC_SANITY_IMAGE_BASE_URL),
    ).toBe(true);
  });
});
