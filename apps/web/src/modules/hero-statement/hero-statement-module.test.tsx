import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_HERO_STATEMENT_HEADING,
  MOCK_HERO_STATEMENT_MODULE_ID,
} from '@web/testing/modules/hero-statement/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { HeroStatementModule } from './hero-statement-module';

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

const mockHeroStatementData = (overrides: Record<string, unknown> = {}) => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: MOCK_HERO_STATEMENT_HEADING }),
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});

const setup = customRenderAsync(HeroStatementModule, {
  id: MOCK_HERO_STATEMENT_MODULE_ID,
});

describe(`<${HeroStatementModule.name}/>`, () => {
  beforeEach(() => {
    getHeroStatementMock.mockReset();
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    getHeroStatementMock.mockResolvedValue(okResult(mockHeroStatementData()));

    await setup();

    expect(getHeroStatementMock).toHaveBeenCalledWith(
      MOCK_HERO_STATEMENT_MODULE_ID,
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroStatementMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroStatementMock.mockResolvedValue(
      okResult(
        mockHeroStatementData({
          headingBlock: makeHeadingBlock({ heading: STATEMENT }),
        }),
      ),
    );

    await setup();

    const heading = screen.getByRole('heading', { level: 1, name: STATEMENT });
    expect(heading).toBeVisible();
  });

  it('serves the hero image from the configured Sanity CDN', async () => {
    const sanityImage = mockSanityImage();
    getHeroStatementMock.mockResolvedValue(
      okResult(mockHeroStatementData({ sanityImage })),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });
    expect(
      image.getAttribute('src')?.startsWith(STATIC_SANITY_IMAGE_BASE_URL),
    ).toBe(true);
  });
});
