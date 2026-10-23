import type { ISanityImage } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import {
  service,
  type TPortableTextBody,
  urlForSanityImage,
} from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  waitFor,
  within,
} from '@web/testing/custom-render';
import {
  MOCK_POST_DETAIL,
  MOCK_POST_DETAIL_AUTHOR_IMAGE,
} from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { PostArticle } from './post-article';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    service: { pages: { post: { v1: { getPost: vi.fn() } } } },
  };
});

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/bookmarks/bookmark-actions/bookmark-actions', () => ({
  getBookmarkStatus: vi.fn(),
  setBookmarkStatus: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

const getPostMock = vi.mocked(service.pages.post.v1.getPost);

const AUTHOR_PROFILE_URL = '/blog/tag/writers';

const setup = customRenderServerAsync(
  PostArticle,
  { slug: MOCK_POST_DETAIL.slug },
  { wrapper: ToastProvider },
);

describe(`<${PostArticle.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue(okResult(MOCK_POST_DETAIL));
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-1' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
    vi.mocked(getBookmarkStatus).mockResolvedValue(false);
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    getPostMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('post_article.fetch_failed', {
      slug: MOCK_POST_DETAIL.slug,
      error: MOCK_ERROR,
    });
  });

  describe('with bookmarks enabled', () => {
    beforeEach(() => {
      vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);
    });

    it('renders the bookmark toggle and share button in the header meta strip', async () => {
      getPostMock.mockResolvedValueOnce(
        okResult({ ...MOCK_POST_DETAIL, tags: [], heroImage: undefined }),
      );

      await setup();

      const header = screen.getByTestId('post-article-header');
      const saveButton = await within(header).findByRole('button', {
        name: 'Save post',
      });
      await waitFor(() => expect(saveButton).toBeEnabled());
      const shareButton = within(header).getByRole('button', { name: /Share/ });

      expect(shareButton).toBeVisible();
    });

    it('checks the bookmark status of this post', async () => {
      await setup();

      const saveButton = await screen.findByRole('button', {
        name: 'Save post',
      });
      await waitFor(() => expect(saveButton).toBeEnabled());
      expect(getBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_DETAIL.id);
    });
  });

  it('renders the topic eyebrow as plain text when the topic has no topic page', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        topic: { ...MOCK_POST_DETAIL.topic, slug: undefined },
      }),
    );

    await setup();

    const engineeringText = screen.getByText('Engineering');
    const engineeringLink = screen.queryByRole('link', { name: 'Engineering' });

    expect(engineeringText).toBeVisible();
    expect(engineeringLink).not.toBeInTheDocument();
  });

  it('links the author to whatever href the service resolved', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        author: {
          ...MOCK_POST_DETAIL.author,
          profileUrl: AUTHOR_PROFILE_URL,
        },
      }),
    );

    await setup();

    const janeDoeLink = screen.getByRole('link', { name: 'Jane Doe' });

    expect(janeDoeLink).toHaveAttribute('href', AUTHOR_PROFILE_URL);
  });

  it('renders the hero image with its own alt text', async () => {
    const heroImage: ISanityImage = {
      assetId: 'image-abc123-1600x1200-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    };
    getPostMock.mockResolvedValueOnce(
      okResult({ ...MOCK_POST_DETAIL, heroImage }),
    );

    await setup();

    const heroImageElement = screen.getByRole('img', { name: heroImage.alt });

    expect(heroImageElement).toBeVisible();
  });

  it('renders the contents rail once the body has 3+ H2 headings', async () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock('Getting started', { style: 'h2' }),
      mockPortableTextBlock('Intro.'),
      mockPortableTextBlock('Configuration', {
        style: 'h2',
        key: 'configuration',
      }),
      mockPortableTextBlock('Deployment', { style: 'h2' }),
    ];
    getPostMock.mockResolvedValueOnce(okResult({ ...MOCK_POST_DETAIL, body }));

    await setup();

    const rail = screen.getByRole('navigation', { name: 'Contents' });
    const configurationLink = within(rail).getByRole('link', {
      name: 'Configuration',
    });

    expect(configurationLink).toHaveAttribute('href', '#configuration');
  });

  it('renders the post tags as links to routes.tag(slug)', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        tags: [
          { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
          { id: 'tag-2', title: 'React', slug: 'react' },
        ],
      }),
    );

    await setup();

    const typeScriptLink = screen.getByRole('link', { name: 'TypeScript' });
    const reactLink = screen.getByRole('link', { name: 'React' });

    expect(typeScriptLink).toHaveAttribute('href', '/tags/typescript');
    expect(reactLink).toHaveAttribute('href', '/tags/react');
  });

  it('omits a tag with no tag page from the footer', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        tags: [
          { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
          { id: 'tag-2', title: 'React', slug: undefined },
        ],
      }),
    );

    await setup();

    const typeScriptLink = screen.getByRole('link', { name: 'TypeScript' });
    const reactText = screen.queryByText('React');

    expect(typeScriptLink).toBeVisible();
    expect(reactText).not.toBeInTheDocument();
  });

  describe('with the default post', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the post for the given slug with the tenant context', async () => {
      expect(getPostMock).toHaveBeenCalledWith(
        MOCK_POST_DETAIL.slug,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the post title, lead, author, and body', async () => {
      const helloWorldHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Hello World',
      });
      const leadText = screen.getByText(
        'A sufficiently long excerpt for the card.',
      );
      const bodyText = screen.getByText('Body text.');
      const janeDoeText = screen.getByText('Jane Doe');

      expect(helloWorldHeading).toBeVisible();
      expect(leadText).toBeVisible();
      expect(bodyText).toBeVisible();
      expect(janeDoeText).toBeVisible();
    });

    it('renders no bookmark toggle when bookmarks are not enabled', async () => {
      const savePostButton = screen.queryByRole('button', {
        name: 'Save post',
      });

      expect(savePostButton).not.toBeInTheDocument();
    });

    it('renders the published date (year/month/day) and the reading time', async () => {
      const publishedDateText = screen.getByText('January 15, 2026');
      const readingTimeText = screen.getByText('4 min read');

      expect(publishedDateText).toBeVisible();
      expect(readingTimeText).toBeVisible();
    });

    it('links the topic eyebrow and the author name to their routes', async () => {
      const topicLinks = screen.getAllByRole('link', { name: 'Engineering' });
      expect(topicLinks.length).toBeGreaterThan(0);
      topicLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/topics/engineering');
      });
      const janeDoeLink = screen.getByRole('link', { name: 'Jane Doe' });

      expect(janeDoeLink).toHaveAttribute('href', '/jane-doe');
    });

    it('renders the share widget with an X and a LinkedIn link', async () => {
      const shareButton = screen.getByRole('button', { name: /Share/ });
      await userEvent.click(shareButton);

      const shareOnXMenuItem = screen.getByRole('menuitem', {
        name: /Share on X/,
      });
      const shareOnLinkedInMenuItem = screen.getByRole('menuitem', {
        name: /Share on LinkedIn/,
      });

      expect(shareOnXMenuItem).toBeVisible();
      expect(shareOnLinkedInMenuItem).toBeVisible();
    });

    it('builds the author avatar at a fixed 64x64 crop, not the full-size asset', async () => {
      const expectedAvatarUrl = urlForSanityImage(
        MOCK_POST_DETAIL_AUTHOR_IMAGE,
        MOCK_TENANT_SANITY_CONTEXT,
        { width: 64, height: 64, fit: 'crop', quality: 75 },
      );

      const avatarImage = screen.getByRole('presentation');

      expect(avatarImage).toHaveAttribute('src', expectedAvatarUrl);
    });

    it('renders no contents rail when the body has fewer than 3 H2 headings', async () => {
      const contentsNav = screen.queryByRole('navigation', {
        name: 'Contents',
      });

      expect(contentsNav).not.toBeInTheDocument();
    });

    it('renders no tag chips when the post has no tags', async () => {
      const typeScriptLink = screen.queryByRole('link', { name: 'TypeScript' });

      expect(typeScriptLink).not.toBeInTheDocument();
    });
  });
});
