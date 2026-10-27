import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_HERO_BLOG_MODULE_ID,
  mockHeroBlogData,
  mockStaleUnresolvedHeroBlogData,
  mockUnresolvedHeroBlogData,
} from '@web/testing/modules/hero-blog/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { HeroBlogModule } from './hero-blog-module';

faker.seed(6011);

const { getHeroBlogMock } = vi.hoisted(() => ({
  getHeroBlogMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroBlog: { v1: { getHeroBlog: getHeroBlogMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_POST_HEADING = faker.lorem.words(3);
const MOCK_STALE_HEADING = faker.lorem.words(5);
const POST_UNRESOLVED_EVENT = 'hero_blog_module.post_unresolved';

const setup = customRenderAsync(HeroBlogModule, {
  id: MOCK_HERO_BLOG_MODULE_ID,
});

describe(`<${HeroBlogModule.name}/>`, () => {
  beforeEach(() => {
    getHeroBlogMock.mockReset();
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    getHeroBlogMock.mockResolvedValue(okResult(mockHeroBlogData()));

    await setup();

    expect(getHeroBlogMock).toHaveBeenCalledWith(
      MOCK_HERO_BLOG_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroBlogMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroBlogMock.mockResolvedValue(
      okResult(mockHeroBlogData({ heading: MOCK_POST_HEADING })),
    );

    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_POST_HEADING,
    });

    expect(heading).toBeVisible();
  });

  it.each([
    { result: 'no post resolves', data: mockUnresolvedHeroBlogData() },
    {
      result: 'a stale unresolved result carries a heading',
      data: mockStaleUnresolvedHeroBlogData(MOCK_STALE_HEADING),
    },
  ])('logs and renders nothing when $result', async ({ data }) => {
    getHeroBlogMock.mockResolvedValue(okResult(data));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).toHaveBeenCalledWith(POST_UNRESOLVED_EVENT, {
      id: MOCK_HERO_BLOG_MODULE_ID,
    });
  });

  it('renders nothing, unlogged, when the post lacks the request language', async () => {
    getHeroBlogMock.mockResolvedValue(
      okResult(mockUnresolvedHeroBlogData({ isPostUntranslated: true })),
    );

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('renders the hero image from the resolved Sanity image', async () => {
    const sanityImage = mockSanityImage();
    getHeroBlogMock.mockResolvedValue(
      okResult(mockHeroBlogData({ sanityImage })),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });

    expect(image).toBeVisible();
  });
});
