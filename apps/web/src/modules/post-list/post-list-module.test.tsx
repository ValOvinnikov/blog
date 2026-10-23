import { NEXT_NAVIGATION_ERROR, TAXONOMY_KIND } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { mockTag } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { PostListModule } from './post-list-module';

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

const FIRST_POST = mockPostCard();
const TAG = mockTag();
const TAG_ARCHIVE = {
  id: TAG.id,
  kind: TAXONOMY_KIND.TAGS,
  slug: TAG.slug!,
  name: TAG.title,
};

const MODULE_ID = 'post-list-1';

const setup = customRenderAsync(PostListModule, {
  id: MODULE_ID,
});

const EMPTY_STATE = 'No posts yet.';
const BROWSE_TOPICS = 'browse topics';
const TOPIC_HEADING = 'Posts in News';
const TOPIC_TITLE_ID = 'topic-posts-title';
const TAG_HEADING = 'Posts tagged TypeScript';
const TAG_TITLE_ID = 'tag-posts-title';

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
      { id: MODULE_ID, page: 2, error: MOCK_ERROR },
    );
  });

  it('fetches the module for the requested page', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          currentPage: 2,
          totalPages: 2,
        }),
      ),
    );

    await setup({ context: { page: 2 } });

    expect(getPostListMock).toHaveBeenCalledWith(
      MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
      2,
      undefined,
    );
  });

  it('defaults the resolved page to 1 when context is absent', async () => {
    await setup({ context: undefined });

    expect(getPostListMock).toHaveBeenCalledWith(
      MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
      1,
      undefined,
    );
  });

  it('renders an authored link in the empty message', async () => {
    vi.mocked(getVoiceRich).mockResolvedValueOnce(
      mockFormattedVoiceRich({ linkText: BROWSE_TOPICS, href: '/topics' }),
    );

    await setup();

    expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('blogListEmpty');
    const link = screen.getByRole('link', { name: BROWSE_TOPICS });
    expect(link).toHaveAttribute('href', '/topics');
  });

  it('renders a translated pager with correct hrefs', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          posts: [FIRST_POST],
          currentPage: 2,
          totalPages: 3,
        }),
      ),
    );

    await setup({ context: { page: 2 } });

    const nav = screen.getByRole('navigation', { name: 'Blog pages' });
    expect(nav).toBeVisible();

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/blog');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/blog/page/3');
  });

  it('calls notFound() when an explicit page exceeds totalPages', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          currentPage: 5,
        }),
      ),
    );

    await expect(setup({ context: { page: 5 } })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the empty message on page 1 of an empty archive', async () => {
    await setup({ context: { page: 1 } });

    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    const emptyMessage = screen.getByText(EMPTY_STATE);
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
            posts: [{ ...FIRST_POST, heroImage: mockSanityImage() }],
            showImages,
          }),
        ),
      );

      await setup();

      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(imageCount);
    },
  );

  it.each([
    {
      kind: TAXONOMY_KIND.TOPICS,
      archive: {
        id: 'topic-1',
        kind: TAXONOMY_KIND.TOPICS,
        slug: 'news',
        name: 'News',
      },
      heading: TOPIC_HEADING,
      titleId: TOPIC_TITLE_ID,
      navName: 'News pages',
      previousHref: '/topics/news',
      nextHref: '/topics/news/page/3',
    },
    {
      kind: TAXONOMY_KIND.TAGS,
      archive: TAG_ARCHIVE,
      heading: TAG_HEADING,
      titleId: TAG_TITLE_ID,
      navName: 'TypeScript pages',
      previousHref: '/tags/typescript',
      nextHref: '/tags/typescript/page/3',
    },
  ])(
    'derives href, aria-label and titleId from a $kind archive',
    async ({ archive, heading, titleId, navName, previousHref, nextHref }) => {
      getPostListMock.mockResolvedValue(
        okResult(
          mockPostListModuleData({
            headingBlock: mockHeadingBlock({ heading }),
            posts: [FIRST_POST],
            currentPage: 2,
            totalPages: 3,
          }),
        ),
      );

      await setup({ context: { page: 2, archive } });

      const headingElement = screen.getByRole('heading', {
        level: 2,
        name: heading,
      });
      const section = screen.getByRole('region', { name: heading });
      const nav = screen.getByRole('navigation', { name: navName });
      expect(headingElement).toHaveAttribute('id', titleId);
      expect(section).toHaveAttribute('aria-labelledby', titleId);
      expect(nav).toBeVisible();
      expect(getPostListMock).toHaveBeenCalledWith(
        MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
        2,
        { termId: archive.id },
      );

      const previousLink = screen.getByRole('link', { name: 'Previous' });
      expect(previousLink).toHaveAttribute('href', previousHref);

      const nextLink = screen.getByRole('link', { name: 'Next' });
      expect(nextLink).toHaveAttribute('href', nextHref);
    },
  );

  it('derives the empty message from a tag archive', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          headingBlock: mockHeadingBlock({ heading: TAG_HEADING }),
        }),
      ),
    );

    await setup({
      context: {
        archive: TAG_ARCHIVE,
      },
    });

    const emptyMessage = screen.getByText('No posts tagged TypeScript yet.');
    const heading = screen.getByRole('heading', {
      level: 2,
      name: TAG_HEADING,
    });
    expect(emptyMessage).toBeVisible();
    expect(heading).toHaveAttribute('id', TAG_TITLE_ID);
  });

  it('keeps the blog-archive defaults without an archive', async () => {
    getPostListMock.mockResolvedValue(
      okResult(
        mockPostListModuleData({
          headingBlock: mockHeadingBlock({ heading: 'All posts' }),
        }),
      ),
    );

    await setup({ context: { page: 1 } });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'All posts',
    });
    const emptyMessage = screen.getByText(EMPTY_STATE);
    expect(heading).toHaveAttribute('id', 'blog-posts-title');
    expect(emptyMessage).toBeVisible();
  });
});
