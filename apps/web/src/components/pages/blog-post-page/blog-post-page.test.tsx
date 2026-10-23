import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

vi.mock('@web/server/request-context/request-context');

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

const SUMMARY_REGION_NAME = '30-second summary';

const setup = customRenderServerAsync(BlogPostPage, {
  slug: mockPostDetail.slug,
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue(okResult({ ...mockPostDetail, modules: [] }));
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
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

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeCrumb = within(breadcrumbs).getByRole('link', {
        name: MOCK_SITE_SETTINGS.brand.name,
      });
      const topicCrumb = within(breadcrumbs).getByRole('link', {
        name: 'Engineering',
      });
      const main = screen.getByRole('main');
      expect(homeCrumb).toBeVisible();
      expect(topicCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders the post article inside main', () => {
      const main = screen.getByRole('main');
      const title = within(main).getByRole('heading', {
        level: 1,
        name: mockPostDetail.title,
      });
      const body = within(main).getByText('Body text.');
      expect(title).toBeVisible();
      expect(body).toBeVisible();
    });

    it('renders exactly one h1', () => {
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
    });

    it('renders no reading-depth control without a skim or asides', () => {
      const depthControl = screen.queryByRole('radiogroup');
      const skim = screen.queryByRole('region', { name: SUMMARY_REGION_NAME });
      expect(depthControl).not.toBeInTheDocument();
      expect(skim).not.toBeInTheDocument();
    });
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    getPostMock.mockResolvedValueOnce(okResult());

    await expect(setup({ slug: 'missing' })).rejects.toThrow(
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
      slug: mockPostDetail.slug,
      error: MOCK_ERROR,
    });
  });

  it('renders the reading-depth control once the post has asides', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({ ...mockPostDetail, modules: [], hasAsides: true }),
    );

    await setup();

    const deepOption = screen.getByRole('radio', { name: 'Deep' });
    expect(deepOption).toBeVisible();
  });

  it('renders the 30s option and the skim panel once the post has a skim', async () => {
    getPostMock.mockResolvedValueOnce(
      okResult({
        ...mockPostDetail,
        modules: [],
        postTakeaways: {
          takeaways: ['First.', 'Second.', 'Third.'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          model: 'claude-haiku-4-5',
        },
      }),
    );

    await setup();

    const skimOption = screen.getByRole('radio', { name: '30s' });
    const main = screen.getByRole('main');
    const skim = within(main).getByRole('region', {
      name: SUMMARY_REGION_NAME,
    });
    const firstTakeaway = within(skim).getByText('First.');
    expect(skimOption).toBeVisible();
    expect(firstTakeaway).toBeVisible();
  });
});
