import {
  NEXT_NAVIGATION_ERROR,
  routes,
  SITE_MESSAGES,
  TAXONOMY_KIND,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { ARIA_LABELLEDBY_ATTRIBUTE } from '@web/testing/shared/aria/constants';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { mockTag } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopic } from '@web/testing/shared/topic/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { PostListModule } from './post-list-module';

faker.seed(6011);

const { getPostListMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

const { previous: PREVIOUS_LABEL, next: NEXT_LABEL } = SITE_MESSAGES.pagination;
const { empty: BLOG_EMPTY_MESSAGE, paginationAriaLabel: BLOG_PAGER_LABEL } =
  SITE_MESSAGES.blogListPage;

const MOCK_POST = mockPostCard();
const MOCK_TOPIC_SLUG = faker.lorem.slug(2);
const MOCK_TOPIC = mockTopic({ slug: MOCK_TOPIC_SLUG });
const MOCK_TAG = mockTag();
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_LINK_TEXT = faker.lorem.words(2);

const MOCK_TOPIC_ARCHIVE = {
  id: MOCK_TOPIC.id,
  kind: TAXONOMY_KIND.TOPICS,
  slug: MOCK_TOPIC_SLUG,
  name: MOCK_TOPIC.title,
};
const MOCK_TAG_ARCHIVE = {
  id: MOCK_TAG.id,
  kind: TAXONOMY_KIND.TAGS,
  slug: MOCK_TAG.slug!,
  name: MOCK_TAG.title,
};

const MOCK_ARCHIVE_CASES = [
  {
    kind: TAXONOMY_KIND.TOPICS,
    archive: MOCK_TOPIC_ARCHIVE,
    messages: SITE_MESSAGES.topicPage,
    createHref: routes.topic,
  },
  {
    kind: TAXONOMY_KIND.TAGS,
    archive: MOCK_TAG_ARCHIVE,
    messages: SITE_MESSAGES.tagPage,
    createHref: routes.tag,
  },
];

const setup = customRenderAsync(PostListModule, {
  id: MOCK_POST_LIST_ID,
});

const mockPagedResult = () =>
  okResult(
    mockPostListModuleData({
      headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
      posts: [MOCK_POST],
      currentPage: 2,
      totalPages: 3,
    }),
  );

describe(`<${PostListModule.name}/>`, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
    getPostListMock.mockResolvedValue(okResult(mockPostListModuleData()));
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostListMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await expect(setup({ context: { page: 2 } })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'post_list_module.fetch_failed',
      { id: MOCK_POST_LIST_ID, page: 2, error: MOCK_ERROR },
    );
  });

  it.each([
    { context: { page: 2 }, page: 2 },
    { context: undefined, page: 1 },
  ])('fetches page $page of the module', async ({ context, page }) => {
    getPostListMock.mockResolvedValue(
      okResult(mockPostListModuleData({ totalPages: 2 })),
    );

    await setup({ context });

    expect(getPostListMock).toHaveBeenCalledWith(
      MOCK_POST_LIST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
      page,
      undefined,
    );
  });

  it('renders an authored link in the empty message', async () => {
    vi.mocked(getVoiceRich).mockResolvedValueOnce(
      mockFormattedVoiceRich({
        linkText: MOCK_LINK_TEXT,
        href: routes.topics(),
      }),
    );

    await setup();

    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });

    expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('blogListEmpty');
    expect(link).toHaveAttribute('href', routes.topics());
  });

  it('renders a translated pager with correct hrefs', async () => {
    getPostListMock.mockResolvedValue(mockPagedResult());

    await setup({ context: { page: 2 } });

    const nav = screen.getByRole('navigation', { name: BLOG_PAGER_LABEL });
    const previousLink = screen.getByRole('link', { name: PREVIOUS_LABEL });
    const nextLink = screen.getByRole('link', { name: NEXT_LABEL });

    expect(nav).toBeVisible();
    expect(previousLink).toHaveAttribute('href', routes.blogIndex(1));
    expect(nextLink).toHaveAttribute('href', routes.blogIndex(3));
  });

  it('calls notFound() when an explicit page exceeds totalPages', async () => {
    getPostListMock.mockResolvedValue(
      okResult(mockPostListModuleData({ currentPage: 5 })),
    );

    await expect(setup({ context: { page: 5 } })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the heading and empty message on page 1 of an empty archive', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
        }),
      ),
    );

    await setup({ context: { page: 1 } });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_HEADING,
    });
    const emptyMessage = screen.getByText(BLOG_EMPTY_MESSAGE);

    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(heading).toBeVisible();
    expect(emptyMessage).toBeVisible();
  });

  it.each([
    { showImages: true, imageCount: 1 },
    { showImages: false, imageCount: 0 },
  ])(
    'renders $imageCount post images when showImages is $showImages',
    async ({ showImages, imageCount }) => {
      getPostListMock.mockResolvedValue(
        okResult(
          mockPostListModuleData({
            posts: [{ ...MOCK_POST, heroImage: mockSanityImage() }],
            showImages,
          }),
        ),
      );

      await setup();

      const images = screen.queryAllByRole('img');

      expect(images).toHaveLength(imageCount);
    },
  );

  it.each([{ kind: 'blog', archive: undefined }, ...MOCK_ARCHIVE_CASES])(
    'labels the $kind region with its heading',
    async ({ archive }) => {
      getPostListMock.mockResolvedValue(mockPagedResult());

      await setup({ context: { page: 1, archive } });

      const region = screen.getByRole('region', { name: MOCK_HEADING });
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_HEADING,
      });

      expect(region).toHaveAttribute(ARIA_LABELLEDBY_ATTRIBUTE, heading.id);
    },
  );

  it.each(MOCK_ARCHIVE_CASES)(
    'fetches only the posts of a $kind archive',
    async ({ archive }) => {
      await setup({ context: { page: 1, archive } });

      expect(getPostListMock).toHaveBeenCalledWith(
        MOCK_POST_LIST_ID,
        MOCK_TENANT_SANITY_CONTEXT,
        1,
        { termId: archive.id },
      );
    },
  );

  it.each(MOCK_ARCHIVE_CASES)(
    'derives the pager label and hrefs from a $kind archive',
    async ({ archive, messages, createHref }) => {
      getPostListMock.mockResolvedValue(mockPagedResult());

      await setup({ context: { page: 2, archive } });

      const nav = screen.getByRole('navigation', {
        name: messages.paginationAriaLabel.replace('{name}', archive.name),
      });
      const previousLink = screen.getByRole('link', { name: PREVIOUS_LABEL });
      const nextLink = screen.getByRole('link', { name: NEXT_LABEL });

      expect(nav).toBeVisible();
      expect(previousLink).toHaveAttribute('href', createHref(archive.slug, 1));
      expect(nextLink).toHaveAttribute('href', createHref(archive.slug, 3));
    },
  );

  it.each(MOCK_ARCHIVE_CASES)(
    'derives the empty message from a $kind archive',
    async ({ archive, messages }) => {
      await setup({ context: { archive } });

      const emptyMessage = screen.getByText(
        messages.empty.replace('{name}', archive.name),
      );

      expect(emptyMessage).toBeVisible();
    },
  );
});
