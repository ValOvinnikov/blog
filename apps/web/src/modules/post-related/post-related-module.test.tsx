import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostRelatedModuleData } from '@web/testing/modules/post-related/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { PostRelatedModule } from './post-related-module';

const { getPostRelatedMock } = vi.hoisted(() => ({
  getPostRelatedMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postRelated: { v1: { getPostRelated: getPostRelatedMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const loggerWarnMock = vi.mocked(logger.warn);

const FIRST_POST_TITLE = 'First post';
const POST_RELATED_ID = 'post-related-1';
const ANCHOR_POST_ID = 'anchor-post-1';

const setup = customRenderAsync(PostRelatedModule, {
  id: POST_RELATED_ID,
  context: { post: { id: ANCHOR_POST_ID } },
});

describe(`<${PostRelatedModule.name}/>`, () => {
  beforeEach(() => {
    getPostRelatedMock.mockReset();
    getPostRelatedMock.mockResolvedValue(okResult(mockPostRelatedModuleData()));
  });

  it('fetches posts related to the anchor post', async () => {
    await setup();

    expect(getPostRelatedMock).toHaveBeenCalledWith(
      POST_RELATED_ID,
      ANCHOR_POST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing and warns once without an anchor post', async () => {
    const { container } = await setup({ context: undefined });

    expect(container).toBeEmptyDOMElement();
    expect(getPostRelatedMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'post_related_module.missing_post_context',
      { id: POST_RELATED_ID },
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getPostRelatedMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved posts and no pagination nav', async () => {
    getPostRelatedMock.mockResolvedValue(
      okResult(
        mockPostRelatedModuleData({
          posts: [mockPostCard({ title: FIRST_POST_TITLE })],
        }),
      ),
    );

    await setup();

    const postTitle = screen.getByText(FIRST_POST_TITLE);
    const pagination = screen.queryByRole('navigation');
    expect(postTitle).toBeVisible();
    expect(pagination).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = mockSanityImage();
    getPostRelatedMock.mockResolvedValue(
      okResult(
        mockPostRelatedModuleData({
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
    getPostRelatedMock.mockResolvedValue(
      okResult(
        mockPostRelatedModuleData({
          posts: [mockPostCard({ heroImage: mockSanityImage() })],
        }),
      ),
    );

    await setup();

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });

  it('renders a related post whose excerpt is absent, without throwing', async () => {
    getPostRelatedMock.mockResolvedValue(
      okResult(
        mockPostRelatedModuleData({
          posts: [
            mockPostCard({ title: FIRST_POST_TITLE, excerpt: undefined }),
          ],
        }),
      ),
    );

    await setup();

    const postTitle = screen.getByText(FIRST_POST_TITLE);
    expect(postTitle).toBeVisible();
  });
});
