import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_HERO_STATEMENT_HEADING,
  MOCK_HERO_STATEMENT_MODULE_ID,
  mockHeroStatementModule,
} from '@web/testing/modules/hero-statement/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const setup = customRenderAsync(HeroStatementModule, {
  id: MOCK_HERO_STATEMENT_MODULE_ID,
});

describe(`<${HeroStatementModule.name}/>`, () => {
  beforeEach(() => {
    getHeroStatementMock.mockReset();
    getHeroStatementMock.mockResolvedValue(okResult(mockHeroStatementModule()));
  });

  describe('with the default module data', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module with the resolved tenant Sanity context', () => {
      expect(getHeroStatementMock).toHaveBeenCalledWith(
        MOCK_HERO_STATEMENT_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved heading', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_HERO_STATEMENT_HEADING,
      });

      expect(heading).toBeVisible();
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroStatementMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('serves the hero image from the configured Sanity CDN', async () => {
    const sanityImage = mockSanityImage();
    getHeroStatementMock.mockResolvedValue(
      okResult(mockHeroStatementModule({ sanityImage })),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });
    const imageSource = image.getAttribute('src');

    expect(imageSource?.startsWith(STATIC_SANITY_IMAGE_BASE_URL)).toBe(true);
  });
});
