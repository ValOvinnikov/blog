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
  mockPostDetail,
  POST_DETAIL_AUTHOR_IMAGE,
} from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
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

const SAVE_POST = 'Save post';
const SHARE = /Share/;
const TOPIC_TITLE = 'Engineering';
const AUTHOR_NAME = 'Jane Doe';
const TYPESCRIPT_TAG = {
  id: 'tag-1',
  title: 'TypeScript',
  slug: MOCK_TAG_SLUG,
};
const REACT_TAG_TITLE = 'React';

const setup = customRenderServerAsync(
  PostArticle,
  { slug: mockPostDetail.slug },
  { wrapper: ToastProvider },
);

describe(`<${PostArticle.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue(okResult(mockPostDetail));
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
      slug: mockPostDetail.slug,
      error: MOCK_ERROR,
    });
  });

  describe('with bookmarks enabled', () => {
    beforeEach(() => {
      vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);
    });

    it('renders the bookmark toggle and share button in the header meta strip', async () => {
      getPostMock.mockResolvedValueOnce(
        okResult({ ...mockPostDetail, tags: [], heroImage: undefined }),
      );

      await setup();

      const header = screen.getByTestId('post-article-header');
      const saveButton = await within(header).findByRole('button', {
        name: SAVE_POST,
      });
      const shareButton = within(header).getByRole('button', { name: SHARE });
      await waitFor(() => expect(saveButton).toBeEnabled());
      expect(shareButton).toBeVisible();
    });

    it('checks the bookmark status of this post', async () => {
      await setup();

      const saveButton = await screen.findByRole('button', { name: SAVE_POST });
      await waitFor(() => expect(saveButton).toBeEnabled());
      expect(getBookmarkStatus).toHaveBeenCalledWith(mockPostDetail.id);
    });
  });

  it('renders the topic eyebrow as plain text when the topic has no topic page', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...mockPostDetail,
        topic: { ...mockPostDetail.topic, slug: undefined },
      }),
    );

    await setup();

    const eyebrow = screen.getByText(TOPIC_TITLE);
    const topicLink = screen.queryByRole('link', { name: TOPIC_TITLE });
    expect(eyebrow).toBeVisible();
    expect(topicLink).not.toBeInTheDocument();
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
      okResult({ ...mockPostDetail, heroImage }),
    );

    await setup();

    const image = screen.getByRole('img', { name: heroImage.alt });
    expect(image).toBeVisible();
  });

  it('renders the contents rail once the body has 3+ H2 headings', async () => {
    const body: TPortableTextBody = [
      portableTextBlock('Getting started', { style: 'h2' }),
      portableTextBlock('Intro.'),
      portableTextBlock('Configuration', { style: 'h2', key: 'configuration' }),
      portableTextBlock('Deployment', { style: 'h2' }),
    ];
    getPostMock.mockResolvedValueOnce(okResult({ ...mockPostDetail, body }));

    await setup();

    const rail = screen.getByRole('navigation', { name: 'Contents' });
    const railLink = within(rail).getByRole('link', { name: 'Configuration' });
    expect(railLink).toHaveAttribute('href', '#configuration');
  });

  it('renders the post tags as links to their tag pages', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...mockPostDetail,
        tags: [
          TYPESCRIPT_TAG,
          { id: 'tag-2', title: REACT_TAG_TITLE, slug: 'react' },
        ],
      }),
    );

    await setup();

    const typescriptLink = screen.getByRole('link', {
      name: TYPESCRIPT_TAG.title,
    });
    const reactLink = screen.getByRole('link', { name: REACT_TAG_TITLE });
    expect(typescriptLink).toHaveAttribute('href', '/tags/typescript');
    expect(reactLink).toHaveAttribute('href', '/tags/react');
  });

  it('omits a tag with no tag page from the footer', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...mockPostDetail,
        tags: [
          TYPESCRIPT_TAG,
          { id: 'tag-2', title: REACT_TAG_TITLE, slug: undefined },
        ],
      }),
    );

    await setup();

    const typescriptLink = screen.getByRole('link', {
      name: TYPESCRIPT_TAG.title,
    });
    const reactTag = screen.queryByText(REACT_TAG_TITLE);
    expect(typescriptLink).toBeVisible();
    expect(reactTag).not.toBeInTheDocument();
  });

  describe('with the default post', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the post for the given slug with the tenant context', () => {
      expect(getPostMock).toHaveBeenCalledWith(
        mockPostDetail.slug,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the post title, lead, author, and body', () => {
      const title = screen.getByRole('heading', {
        level: 1,
        name: 'Hello World',
      });
      const lead = screen.getByText(
        'A sufficiently long excerpt for the card.',
      );
      const body = screen.getByText('Body text.');
      const author = screen.getByText(AUTHOR_NAME);
      expect(title).toBeVisible();
      expect(lead).toBeVisible();
      expect(body).toBeVisible();
      expect(author).toBeVisible();
    });

    it('renders no bookmark toggle when bookmarks are not enabled', () => {
      const saveButton = screen.queryByRole('button', { name: SAVE_POST });
      expect(saveButton).not.toBeInTheDocument();
    });

    it('renders the published date (year/month/day) and the reading time', () => {
      const publishedDate = screen.getByText('January 15, 2026');
      const readingTime = screen.getByText('4 min read');
      expect(publishedDate).toBeVisible();
      expect(readingTime).toBeVisible();
    });

    it('links the topic eyebrow and the author name to their routes', () => {
      const topicLinks = screen.getAllByRole('link', { name: TOPIC_TITLE });
      const authorLink = screen.getByRole('link', { name: AUTHOR_NAME });
      expect(topicLinks.length).toBeGreaterThan(0);
      topicLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/topics/engineering');
      });
      expect(authorLink).toHaveAttribute('href', '/jane-doe');
    });

    it('renders the share widget with an X and a LinkedIn link', async () => {
      const user = userEvent.setup();
      const shareButton = screen.getByRole('button', { name: SHARE });

      await user.click(shareButton);

      const shareOnX = screen.getByRole('menuitem', { name: /Share on X/ });
      const shareOnLinkedIn = screen.getByRole('menuitem', {
        name: /Share on LinkedIn/,
      });
      expect(shareOnX).toBeVisible();
      expect(shareOnLinkedIn).toBeVisible();
    });

    it('builds the author avatar at a fixed 64x64 crop, not the full-size asset', () => {
      const expectedAvatarUrl = urlForSanityImage(
        POST_DETAIL_AUTHOR_IMAGE,
        MOCK_TENANT_SANITY_CONTEXT,
        { width: 64, height: 64, fit: 'crop', quality: 75 },
      );

      const avatar = screen.getByRole('presentation');
      expect(avatar).toHaveAttribute('src', expectedAvatarUrl);
    });

    it('renders no contents rail when the body has fewer than 3 H2 headings', () => {
      const rail = screen.queryByRole('navigation', { name: 'Contents' });
      expect(rail).not.toBeInTheDocument();
    });

    it('renders no tag chips when the post has no tags', () => {
      const tagLink = screen.queryByRole('link', {
        name: TYPESCRIPT_TAG.title,
      });
      expect(tagLink).not.toBeInTheDocument();
    });
  });
});
