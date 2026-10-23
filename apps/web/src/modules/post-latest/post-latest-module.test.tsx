import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostLatestModuleData } from '@web/testing/modules/post-latest/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostLatestModule } from './post-latest-module';

const MODULE_ID = 'post-latest-1';
const POST = makePostCard();

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
  id: MODULE_ID,
});

describe(`<${PostLatestModule.name}/>`, () => {
  beforeEach(() => {
    getPostLatestMock.mockReset();
    getPostLatestMock.mockResolvedValue(okResult(mockPostLatestModuleData()));
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    await setup();

    expect(getPostLatestMock).toHaveBeenCalledWith(
      MODULE_ID,
      DEFAULT_TENANT_SANITY_CONTEXT,
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
      okResult(mockPostLatestModuleData({ posts: [POST] })),
    );

    await setup();

    const postTitle = screen.getByText(POST.title);
    const pagination = screen.queryByRole('navigation');
    expect(postTitle).toBeVisible();
    expect(pagination).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = mockSanityImage();
    getPostLatestMock.mockResolvedValue(
      okResult(
        mockPostLatestModuleData({
          posts: [makePostCard({ heroImage: sanityImage })],
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
          posts: [makePostCard({ heroImage: mockSanityImage() })],
          showImages: false,
        }),
      ),
    );

    await setup();

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });
});
