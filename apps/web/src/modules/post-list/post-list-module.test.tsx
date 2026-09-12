import { BRAND_VARIANT, TAXONOMY_KIND } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
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
  tenant: 'tenant-1',
});

describe(`<${PostListModule.name}/>`, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    getPostListMock.mockResolvedValue({ ok: false, error });

    await expect(setup({ context: { page: 2 } })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('post_list_module.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls getPostList with the module id and context.page', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 2,
        totalPages: 2,
      },
    });

    await setup({ context: { page: 2 } });

    expect(getPostListMock).toHaveBeenCalledWith(
      'post-list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      2,
      undefined,
    );
  });

  it('defaults the resolved page to 1 when context is absent', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ context: undefined });

    expect(getPostListMock).toHaveBeenCalledWith(
      'post-list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      1,
      undefined,
    );
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
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    expect(getPostListMock).toHaveBeenCalledWith(
      'post-list-1',
      tenant,
      1,
      undefined,
    );
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders an archive-appropriate accessible heading (never "Latest posts")', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: '' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
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
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
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
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
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
        contentAlignment: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({ context: { page: 2 } });

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
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 5,
        totalPages: 1,
      },
    });

    await expect(setup({ context: { page: 5 } })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('does not 404 page 1 of an empty archive, and renders the derived empty message', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ context: { page: 1 } });

    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = makeSanityImage();
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
            heroImage: sanityImage,
          },
        ],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
        showImages: true,
      },
    });

    await setup();

    expect(
      screen.getByRole('img', { name: sanityImage.alt }),
    ).toBeInTheDocument();
  });

  it('renders no post images when showImages is false', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Blog' }),
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
            heroImage: makeSanityImage(),
          },
        ],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
        showImages: false,
      },
    });

    await setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('derives href, aria-label, accessible title, empty message, and titleId from context.archive (topic kind)', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: '' }),
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
        contentAlignment: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({
      context: {
        page: 2,
        archive: { kind: TAXONOMY_KIND.TOPICS, slug: 'news', name: 'News' },
      },
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Posts in News' }),
    ).toHaveAttribute('id', 'topic-posts-title');
    expect(
      screen.getByRole('region', { name: 'Posts in News' }),
    ).toHaveAttribute('aria-labelledby', 'topic-posts-title');
    expect(
      screen.getByRole('navigation', { name: 'News pages' }),
    ).toBeInTheDocument();
    expect(getPostListMock).toHaveBeenCalledWith(
      'post-list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      2,
      { kind: TAXONOMY_KIND.TOPICS, slug: 'news' },
    );

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/topics/news');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/topics/news/page/3');
  });

  it('derives href, aria-label, and titleId from context.archive (tag kind)', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: '' }),
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
        contentAlignment: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({
      context: {
        page: 2,
        archive: {
          kind: TAXONOMY_KIND.TAGS,
          slug: 'typescript',
          name: 'TypeScript',
        },
      },
    });

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Posts tagged TypeScript',
      }),
    ).toHaveAttribute('id', 'tag-posts-title');
    expect(
      screen.getByRole('navigation', { name: 'TypeScript pages' }),
    ).toBeInTheDocument();
    expect(getPostListMock).toHaveBeenCalledWith(
      'post-list-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
      2,
      { kind: TAXONOMY_KIND.TAGS, slug: 'typescript' },
    );

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/tags/typescript');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/tags/typescript/page/3');
  });

  it('derives the empty message from context.archive (tag kind)', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: '' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({
      context: {
        archive: {
          kind: TAXONOMY_KIND.TAGS,
          slug: 'typescript',
          name: 'TypeScript',
        },
      },
    });

    expect(
      screen.getByText('No posts tagged TypeScript yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Posts tagged TypeScript',
      }),
    ).toHaveAttribute('id', 'tag-posts-title');
  });

  it('keeps the blog-archive defaults intact when context.archive is absent', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: '' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ context: { page: 1 } });

    expect(
      screen.getByRole('heading', { level: 2, name: 'All posts' }),
    ).toHaveAttribute('id', 'blog-posts-title');
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });
});
