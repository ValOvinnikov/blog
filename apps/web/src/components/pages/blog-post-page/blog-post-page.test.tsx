import { service } from '@blog/service';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/service')>();
  return {
    ...actual,
    service: {
      pages: { post: { v1: { getPost: vi.fn() } } },
    },
  };
});

vi.mock('@web/utils/logger/logger');

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

const setup = customRenderServerAsync(BlogPostPage, {
  slug: 'hello-world',
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, modules: [] },
    });
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    getPostMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostMock.mockResolvedValueOnce({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'blog_post_page.fetch_failed',
      expect.objectContaining({ slug: 'hello-world' }),
    );
  });

  it('fetches the post for the given slug with the tenant context', async () => {
    await setup();

    expect(getPostMock).toHaveBeenCalledWith(
      'hello-world',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the breadcrumb trail outside main', async () => {
    await setup();

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumbs).getByRole('link', { name: 'Home' }),
    ).toBeVisible();
    expect(
      within(breadcrumbs).getByRole('link', { name: 'Engineering' }),
    ).toBeVisible();
    expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
  });

  it('renders the post article inside main', async () => {
    await setup();

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(within(main).getByText('Body text.')).toBeVisible();
  });

  it('renders exactly one h1, from the post', async () => {
    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders no reading-depth control without a skim or asides', async () => {
    await setup();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: '30-second summary' }),
    ).not.toBeInTheDocument();
  });

  it('renders the reading-depth control once the post has asides', async () => {
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: { ...mockPostDetail, modules: [], hasAsides: true },
    });

    await setup();

    expect(screen.getByRole('radio', { name: 'Deep' })).toBeVisible();
  });

  it('renders the 30s option and the skim panel once the post has a skim', async () => {
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockPostDetail,
        modules: [],
        postTakeaways: {
          takeaways: ['First.', 'Second.', 'Third.'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          model: 'claude-haiku-4-5',
        },
      },
    });

    await setup();

    expect(screen.getByRole('radio', { name: '30s' })).toBeVisible();
    const skim = within(screen.getByRole('main')).getByRole('region', {
      name: '30-second summary',
    });
    expect(within(skim).getByText('First.')).toBeVisible();
  });
});
