import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { PostListModule } from './post-list-module';

const { getPostListMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(PostListModule, {
  id: 'post-list-1',
  locale: 'en',
  page: 1,
});

describe(PostListModule, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    getPostListMock.mockResolvedValue({ ok: false, error });

    await expect(setup({ page: 2 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('post_list_module.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls getPostList with the module id and page', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 2,
        totalPages: 2,
      },
    });

    await setup({ page: 2 });

    expect(getPostListMock).toHaveBeenCalledWith('post-list-1', 2, undefined);
  });

  it('forwards the resolved tenant Sanity context to getPostList', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    expect(getPostListMock).toHaveBeenCalledWith('post-list-1', 1, tenant);
  });

  it('renders an archive-appropriate accessible heading (never "Latest posts")', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: undefined,
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'All posts',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'All posts' }),
    ).toBeInTheDocument();
  });

  it('renders the i18n default empty message when zero posts resolve, unconditionally', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('renders a pager with a fully translated aria-label and correct hrefs', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({ page: 2 });

    const nav = screen.getByRole('navigation', { name: 'Blog pages' });
    expect(nav).toBeInTheDocument();

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/blog');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/blog/page/3');
  });

  it('calls notFound() when an explicit page exceeds totalPages', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 5,
        totalPages: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('does not 404 page 1 of an empty archive, and renders the derived empty message', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ page: 1 });

    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('uses the caller-supplied ariaLabel for the pagination nav instead of the translated default', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'News',
          supportingText: undefined,
          align: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({ page: 2, ariaLabel: 'News pages' });

    expect(
      screen.getByRole('navigation', { name: 'News pages' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Blog pages' }),
    ).not.toBeInTheDocument();
  });

  it('uses the caller-supplied accessibleTitle as the fallback heading instead of the blog archive default', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: undefined,
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ accessibleTitle: 'News' });

    expect(
      screen.getByRole('heading', { level: 2, name: 'News' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'All posts' }),
    ).not.toBeInTheDocument();
  });

  it('renders the caller-supplied emptyMessageFallback when zero posts resolve, instead of the blog archive default', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'News',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ emptyMessageFallback: 'No posts in this topic yet.' });

    expect(screen.getByText('No posts in this topic yet.')).toBeInTheDocument();
    expect(screen.queryByText('No posts yet.')).not.toBeInTheDocument();
  });

  it('builds pagination links with the caller-supplied createHref instead of the blog index default', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'News',
          supportingText: undefined,
          align: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({
      page: 2,
      createHref: (page: number) => `/topics/news/page/${page}`,
    });

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/topics/news/page/1');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/topics/news/page/3');
  });

  it('wires the caller-supplied titleId to both the heading id and the section aria-labelledby', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'News',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ titleId: 'topic-news-title' });

    const heading = screen.getByRole('heading', { level: 2, name: 'News' });
    expect(heading).toHaveAttribute('id', 'topic-news-title');

    const region = screen.getByRole('region', { name: 'News' });
    expect(region).toHaveAttribute('aria-labelledby', 'topic-news-title');
  });
});
