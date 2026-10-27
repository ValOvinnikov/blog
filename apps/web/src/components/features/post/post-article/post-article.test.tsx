import { routes, SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import {
  service,
  type TPortableTextBody,
  urlForSanityImage,
} from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
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

const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_AUTHOR_PROFILE_URL = `/${faker.lorem.slug()}`;
const MOCK_TYPESCRIPT_TAG = mockTag();
const MOCK_OTHER_TAG_SLUG = faker.lorem.slug();
const MOCK_OTHER_TAG = mockTag({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: MOCK_OTHER_TAG_SLUG,
});
const MOCK_EXCERPT = faker.lorem.sentence();
const MOCK_RAIL_HEADING = faker.lorem.words(2);
const MOCK_RAIL_HEADING_KEY = faker.lorem.slug();
const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_POST = {
  ...MOCK_POST_DETAIL,
  excerpt: MOCK_EXCERPT,
  topic: { ...MOCK_POST_DETAIL.topic, slug: MOCK_TOPIC_SLUG },
  body: [mockPortableTextBlock(MOCK_BODY_TEXT)],
};

const FORMATTED_PUBLISHED_DATE = 'January 15, 2026';
const READING_TIME_TEXT = `${MOCK_POST_DETAIL.readingTimeMinutes} min read`;
const HEADER_TEST_ID = 'post-article-header';

const { author, topic } = MOCK_POST;
const { saveAriaLabel } = SITE_MESSAGES.bookmarkButton;
const { label: contentsLabel } = SITE_MESSAGES.postContentsRail;
const shareButtonName = SITE_MESSAGES.postShare.shareAriaLabel.replace(
  '{title}',
  MOCK_POST_DETAIL.title,
);

const setup = customRenderServerAsync(
  PostArticle,
  { slug: MOCK_POST_DETAIL.slug },
  { wrapper: ToastProvider },
);

describe(`<${PostArticle.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue(okResult(MOCK_POST));
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
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'post_article.fetch_failed',
      {
        slug: MOCK_POST_DETAIL.slug,
        error: MOCK_ERROR,
      },
    );
  });

  it('renders the bookmark toggle and share button in the header', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);
    getPostMock.mockResolvedValueOnce(
      okResult({ ...MOCK_POST, tags: [], heroImage: undefined }),
    );

    await setup();

    const header = screen.getByTestId(HEADER_TEST_ID);
    const saveButton = await within(header).findByRole('button', {
      name: saveAriaLabel,
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
    const shareButton = within(header).getByRole('button', {
      name: shareButtonName,
    });

    expect(saveButton).toBeVisible();
    expect(shareButton).toBeVisible();
  });

  it('renders the topic eyebrow as plain text when the topic has no topic page', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST,
        topic: { ...topic, slug: undefined },
      }),
    );

    await setup();

    const topicText = screen.getByText(topic.title);
    const topicLink = screen.queryByRole('link', { name: topic.title });

    expect(topicText).toBeVisible();
    expect(topicLink).not.toBeInTheDocument();
  });

  it('links the author to the profile URL the service resolved', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST,
        author: { ...author, profileUrl: MOCK_AUTHOR_PROFILE_URL },
      }),
    );

    await setup();

    const authorLink = screen.getByRole('link', { name: author.name });

    expect(authorLink).toHaveAttribute('href', MOCK_AUTHOR_PROFILE_URL);
  });

  it('renders the hero image with its own alt text', async () => {
    const heroImage = mockSanityImage({ alt: faker.lorem.sentence() });
    getPostMock.mockResolvedValueOnce(okResult({ ...MOCK_POST, heroImage }));

    await setup();

    const heroImageElement = screen.getByRole('img', { name: heroImage.alt });

    expect(heroImageElement).toBeVisible();
  });

  it('renders the contents rail once the body has 3+ H2 headings', async () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock(faker.lorem.words(2), { style: 'h2' }),
      mockPortableTextBlock(MOCK_BODY_TEXT),
      mockPortableTextBlock(MOCK_RAIL_HEADING, {
        style: 'h2',
        key: MOCK_RAIL_HEADING_KEY,
      }),
      mockPortableTextBlock(faker.lorem.words(2), { style: 'h2' }),
    ];
    getPostMock.mockResolvedValueOnce(okResult({ ...MOCK_POST, body }));

    await setup();

    const rail = screen.getByRole('navigation', { name: contentsLabel });
    const headingLink = within(rail).getByRole('link', {
      name: MOCK_RAIL_HEADING,
    });

    expect(headingLink).toHaveAttribute('href', `#${MOCK_RAIL_HEADING_KEY}`);
  });

  it('links each post tag to its tag page', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST,
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

    expect(typeScriptLink).toHaveAttribute('href', routes.tag(MOCK_TAG_SLUG));
    expect(otherTagLink).toHaveAttribute(
      'href',
      routes.tag(MOCK_OTHER_TAG_SLUG),
    );
  });

  it('omits a tag with no tag page from the footer', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST,
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

    it('fetches the post for the given slug with the tenant context', () => {
      expect(getPostMock).toHaveBeenCalledWith(
        MOCK_POST_DETAIL.slug,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the post title, lead, author, and body', () => {
      const titleHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_POST_DETAIL.title,
      });
      const leadText = screen.getByText(MOCK_EXCERPT);
      const bodyText = screen.getByText(MOCK_BODY_TEXT);
      const authorText = screen.getByText(author.name);

      expect(titleHeading).toBeVisible();
      expect(leadText).toBeVisible();
      expect(bodyText).toBeVisible();
      expect(authorText).toBeVisible();
    });

    it('renders the published date and the reading time', () => {
      const publishedDateText = screen.getByText(FORMATTED_PUBLISHED_DATE);
      const readingTimeText = screen.getByText(READING_TIME_TEXT);

      expect(publishedDateText).toBeVisible();
      expect(readingTimeText).toBeVisible();
    });

    it('links the topic eyebrow and the author name to their routes', () => {
      const header = screen.getByTestId(HEADER_TEST_ID);
      const topicLink = within(header).getByRole('link', {
        name: topic.title,
      });
      const authorLink = within(header).getByRole('link', {
        name: author.name,
      });

      expect(topicLink).toHaveAttribute('href', routes.topic(MOCK_TOPIC_SLUG));
      expect(authorLink).toHaveAttribute('href', author.profileUrl);
    });

    it('builds the author avatar at a fixed 64x64 crop, not the full-size asset', () => {
      const expectedAvatarUrl = urlForSanityImage(
        MOCK_POST_DETAIL_AUTHOR_IMAGE,
        MOCK_TENANT_SANITY_CONTEXT,
        { width: 64, height: 64, fit: 'crop', quality: 75 },
      );

      const avatarImage = screen.getByRole('presentation');

      expect(avatarImage).toHaveAttribute('src', expectedAvatarUrl);
    });

    it('renders no contents rail when the body has fewer than 3 H2 headings', () => {
      const contentsNav = screen.queryByRole('navigation', {
        name: contentsLabel,
      });

      expect(contentsNav).not.toBeInTheDocument();
    });

    it('renders no tag chips when the post has no tags', () => {
      const typeScriptLink = screen.queryByRole('link', {
        name: MOCK_TYPESCRIPT_TAG.title,
      });

      expect(typeScriptLink).not.toBeInTheDocument();
    });
  });
});
