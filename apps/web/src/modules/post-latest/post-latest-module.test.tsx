import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostLatestModuleData } from '@web/testing/modules/post-latest/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostLatestModule } from './post-latest-module';

faker.seed(6011);

const MOCK_MODULE_ID = faker.string.uuid();
const MOCK_POST = mockPostCard({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
});

const { getPostLatestMock } = vi.hoisted(() => ({
  getPostLatestMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postLatest: { v1: { getPostLatest: getPostLatestMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const setup = customRenderAsync(PostLatestModule, {
  id: MOCK_MODULE_ID,
});

describe(`<${PostLatestModule.name}/>`, () => {
  beforeEach(() => {
    getPostLatestMock.mockReset();
    getPostLatestMock.mockResolvedValue(okResult(mockPostLatestModuleData()));
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    await setup();

    expect(getPostLatestMock).toHaveBeenCalledWith(
      MOCK_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getPostLatestMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved posts and no pagination nav', async () => {
    getPostLatestMock.mockResolvedValue(
      okResult(mockPostLatestModuleData({ posts: [MOCK_POST] })),
    );

    await setup();

    const postTitle = screen.getByText(MOCK_POST.title);
    const pagination = screen.queryByRole('navigation');

    expect(postTitle).toBeVisible();
    expect(pagination).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = mockSanityImage();
    getPostLatestMock.mockResolvedValue(
      okResult(
        mockPostLatestModuleData({
          posts: [mockPostCard({ heroImage: sanityImage })],
          showImages: true,
        }),
      ),
    );

    await setup();

    const image = screen.getByRole('img', { name: sanityImage.alt });

    expect(image).toBeVisible();
  });

  it('renders no post images when showImages is false', async () => {
    getPostLatestMock.mockResolvedValue(
      okResult(
        mockPostLatestModuleData({
          posts: [mockPostCard({ heroImage: mockSanityImage() })],
          showImages: false,
        }),
      ),
    );

    await setup();

    const image = screen.queryByRole('img');

    expect(image).not.toBeInTheDocument();
  });
});
