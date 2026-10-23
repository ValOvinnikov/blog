import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostLatestModuleData } from '@web/testing/modules/post-latest/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostLatestModule } from './post-latest-module';

const MODULE_ID = 'post-latest-1';
const POST = mockPostCard();

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
      okResult(mockPostLatestModuleData({ posts: [POST] })),
    );

    await setup();

    const postTitle = screen.getByText(POST.title);
    const pagination = screen.queryByRole('navigation');
    expect(postTitle).toBeVisible();
    expect(pagination).not.toBeInTheDocument();
  });

  it.each([
    { showImages: true, imageCount: 1 },
    { showImages: false, imageCount: 0 },
  ])(
    'renders $imageCount post images when showImages is $showImages',
    async ({ showImages, imageCount }) => {
      getPostLatestMock.mockResolvedValue(
        okResult(
          mockPostLatestModuleData({
            posts: [mockPostCard({ heroImage: mockSanityImage() })],
            showImages,
          }),
        ),
      );

      await setup();

      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(imageCount);
    },
  );
});
