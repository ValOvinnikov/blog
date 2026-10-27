import { SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import {
  service,
  type TPortableTextBody,
  urlForSanityImage,
} from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { SESSION_STATUS } from '@web/constants/session';
import { ToastProvider } from '@web/context/toast-provider';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  waitFor,
  within,
} from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_POST_DETAIL,
  MOCK_POST_DETAIL_AUTHOR_IMAGE,
} from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_TAG_SLUG, mockTag } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { PostArticle } from './post-article';

faker.seed(5776);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

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

const MOCK_AUTHOR_PROFILE_URL = `/${faker.lorem.slug()}`;
const MOCK_TYPESCRIPT_TAG = mockTag();
const MOCK_OTHER_TAG = mockTag({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: faker.lorem.slug(),
});
const MOCK_RAIL_HEADING = faker.lorem.words(2);
const MOCK_RAIL_HEADING_KEY = faker.lorem.slug();

const { author, topic } = MOCK_POST_DETAIL;
const { saveAriaLabel } = SITE_MESSAGES.bookmarkButton;
const { label: contentsLabel } = SITE_MESSAGES.postContentsRail;

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
      data: { user: { id: faker.string.uuid() }, expires: '' },
      status: SESSION_STATUS.AUTHENTICATED,
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
        name: saveAriaLabel,
      });
      await waitFor(() => expect(saveButton).toBeEnabled());
      const shareButton = within(header).getByRole('button', { name: /Share/ });

      expect(shareButton).toBeVisible();
    });

    it('checks the bookmark status of this post', async () => {
      await setup();

      const saveButton = await screen.findByRole('button', {
        name: saveAriaLabel,
      });
      await waitFor(() => expect(saveButton).toBeEnabled());
      expect(getBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_DETAIL.id);
    });
  });

  it('renders the topic eyebrow as plain text when the topic has no topic page', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        topic: { ...topic, slug: undefined },
      }),
    );

    await setup();

    const topicText = screen.getByText(topic.title);
    const topicLink = screen.queryByRole('link', { name: topic.title });

    expect(topicText).toBeVisible();
    expect(topicLink).not.toBeInTheDocument();
  });

  it('links the author to whatever href the service resolved', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        author: { ...author, profileUrl: MOCK_AUTHOR_PROFILE_URL },
      }),
    );

    await setup();

    const authorLink = screen.getByRole('link', { name: author.name });

    expect(authorLink).toHaveAttribute('href', MOCK_AUTHOR_PROFILE_URL);
  });

  it('renders the hero image with its own alt text', async () => {
    const heroImage = mockSanityImage({ alt: faker.lorem.sentence() });
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
      mockPortableTextBlock(MOCK_RAIL_HEADING, {
        style: 'h2',
        key: MOCK_RAIL_HEADING_KEY,
      }),
      mockPortableTextBlock('Deployment', { style: 'h2' }),
    ];
    getPostMock.mockResolvedValueOnce(okResult({ ...MOCK_POST_DETAIL, body }));

    await setup();

    const rail = screen.getByRole('navigation', { name: contentsLabel });
    const headingLink = within(rail).getByRole('link', {
      name: MOCK_RAIL_HEADING,
    });

    expect(headingLink).toHaveAttribute('href', `#${MOCK_RAIL_HEADING_KEY}`);
  });

  it('renders the post tags as links to routes.tag(slug)', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        tags: [MOCK_TYPESCRIPT_TAG, MOCK_OTHER_TAG],
      }),
    );

    await setup();

    const typeScriptLink = screen.getByRole('link', {
      name: MOCK_TYPESCRIPT_TAG.title,
    });
    const otherTagLink = screen.getByRole('link', {
      name: MOCK_OTHER_TAG.title,
    });

    expect(typeScriptLink).toHaveAttribute('href', `/tags/${MOCK_TAG_SLUG}`);
    expect(otherTagLink).toHaveAttribute(
      'href',
      `/tags/${MOCK_OTHER_TAG.slug}`,
    );
  });

  it('omits a tag with no tag page from the footer', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        tags: [MOCK_TYPESCRIPT_TAG, { ...MOCK_OTHER_TAG, slug: undefined }],
      }),
    );

    await setup();

    const typeScriptLink = screen.getByRole('link', {
      name: MOCK_TYPESCRIPT_TAG.title,
    });
    const otherTagText = screen.queryByText(MOCK_OTHER_TAG.title);

    expect(typeScriptLink).toBeVisible();
    expect(otherTagText).not.toBeInTheDocument();
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
      const titleHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_POST_DETAIL.title,
      });
      const leadText = screen.getByText(
        'A sufficiently long excerpt for the card.',
      );
      const bodyText = screen.getByText('Body text.');
      const authorText = screen.getByText(author.name);

      expect(titleHeading).toBeVisible();
      expect(leadText).toBeVisible();
      expect(bodyText).toBeVisible();
      expect(authorText).toBeVisible();
    });

    it('renders the published date (year/month/day) and the reading time', async () => {
      const publishedDateText = screen.getByText('January 15, 2026');
      const readingTimeText = screen.getByText('4 min read');

      expect(publishedDateText).toBeVisible();
      expect(readingTimeText).toBeVisible();
    });

    it('links the topic eyebrow and the author name to their routes', async () => {
      const topicLinks = screen.getAllByRole('link', { name: topic.title });
      expect(topicLinks.length).toBeGreaterThan(0);
      topicLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/topics/engineering');
      });
      const authorLink = screen.getByRole('link', { name: author.name });

      expect(authorLink).toHaveAttribute('href', author.profileUrl);
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
      const typeScriptLink = screen.queryByRole('link', {
        name: MOCK_TYPESCRIPT_TAG.title,
      });

      expect(typeScriptLink).not.toBeInTheDocument();
    });
  });
});
