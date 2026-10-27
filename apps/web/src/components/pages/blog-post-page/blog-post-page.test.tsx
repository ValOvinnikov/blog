import { SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import {
  MOCK_POST_DETAIL,
  MOCK_POST_DETAIL_BODY_TEXT,
} from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

faker.seed(5776);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    service: {
      pages: { post: { v1: { getPost: vi.fn() } } },
    },
  };
});

vi.mock('@web/i18n/navigation');

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

const getPostMock = vi.mocked(service.pages.post.v1.getPost);

const MOCK_MISSING_SLUG = faker.lorem.slug();
const MOCK_FIRST_TAKEAWAY = faker.lorem.sentence();
const MOCK_GENERATED_AT = faker.date.recent().toISOString();
const MOCK_MODEL = faker.string.alphanumeric(12);
const MOCK_TAKEAWAYS = [
  MOCK_FIRST_TAKEAWAY,
  faker.lorem.sentence(),
  faker.lorem.sentence(),
];

const { depthToggle, skimPanel } = SITE_MESSAGES.blogPostPage;

const setup = customRenderServerAsync(BlogPostPage, {
  slug: MOCK_POST_DETAIL.slug,
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue(
      okResult({ ...MOCK_POST_DETAIL, modules: [] }),
    );
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
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

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const brandLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_SITE_SETTINGS.brand.name,
      });
      const topicLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_POST_DETAIL.topic.title,
      });
      const main = screen.getByRole('main');

      expect(brandLink).toBeVisible();
      expect(topicLink).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders the post article inside main', () => {
      const main = screen.getByRole('main');
      const titleHeading = within(main).getByRole('heading', {
        level: 1,
        name: MOCK_POST_DETAIL.title,
      });
      const bodyText = within(main).getByText(MOCK_POST_DETAIL_BODY_TEXT);

      expect(titleHeading).toBeVisible();
      expect(bodyText).toBeVisible();
    });

    it('renders exactly one h1, from the post', () => {
      const h1Headings = screen.getAllByRole('heading', { level: 1 });
      const titleHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_POST_DETAIL.title,
      });

      expect(h1Headings).toHaveLength(1);
      expect(titleHeading).toBeVisible();
    });

    it('renders no reading-depth control without a skim or asides', () => {
      const radiogroup = screen.queryByRole('radiogroup');
      const summaryRegion = screen.queryByRole('region', {
        name: skimPanel.label,
      });

      expect(radiogroup).not.toBeInTheDocument();
      expect(summaryRegion).not.toBeInTheDocument();
    });
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    getPostMock.mockResolvedValueOnce(okResult());

    await expect(setup({ slug: MOCK_MISSING_SLUG })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('blog_post_page.fetch_failed', {
      slug: MOCK_POST_DETAIL.slug,
      error: MOCK_ERROR,
    });
  });

  it('renders the reading-depth control once the post has asides', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({ ...MOCK_POST_DETAIL, modules: [], hasAsides: true }),
    );

    await setup();

    const deepRadio = screen.getByRole('radio', { name: depthToggle.deep });

    expect(deepRadio).toBeVisible();
  });

  it('renders the 30s option and the skim panel once the post has a skim', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...MOCK_POST_DETAIL,
        modules: [],
        postTakeaways: {
          takeaways: MOCK_TAKEAWAYS,
          generatedAt: MOCK_GENERATED_AT,
          model: MOCK_MODEL,
        },
      }),
    );

    await setup();

    const thirtySecondRadio = screen.getByRole('radio', {
      name: depthToggle.skim,
    });
    const main = screen.getByRole('main');
    const skim = within(main).getByRole('region', { name: skimPanel.label });
    const firstText = within(skim).getByText(MOCK_FIRST_TAKEAWAY);

    expect(thirtySecondRadio).toBeVisible();
    expect(firstText).toBeVisible();
  });
});
