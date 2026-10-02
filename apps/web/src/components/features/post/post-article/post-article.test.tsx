import type { ISanityImage } from '@blog/config';
import {
  service,
  type TPortableTextBody,
  urlForSanityImage,
} from '@blog/service';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
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
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { PostArticle } from './post-article';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/service')>();
  return {
    ...actual,
    service: { pages: { post: { v1: { getPost: vi.fn() } } } },
  };
});

vi.mock('@web/utils/logger/logger');

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: vi.fn(),
}));

vi.mock('@web/server/bookmarks/bookmark-actions', () => ({
  getBookmarkStatus: vi.fn(),
  setBookmarkStatus: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

const getPostMock = vi.mocked(service.pages.post.v1.getPost);

const setup = customRenderServerAsync(
  PostArticle,
  { slug: 'hello-world' },
  { wrapper: ToastProvider },
);

describe(`<${PostArticle.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-1' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
    vi.mocked(getBookmarkStatus).mockResolvedValue(false);
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    getPostMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPostMock.mockResolvedValueOnce({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'post_article.fetch_failed',
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

  it('renders the post title, lead, author, and body', async () => {
    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(
      screen.getByText('A sufficiently long excerpt for the card.'),
    ).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByText('Jane Doe')).toBeVisible();
  });

  it('renders the bookmark toggle and share button in the header meta strip', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: { ...mockPostDetail, tags: [], heroImage: undefined },
    });

    await setup();

    const header = screen.getByTestId('post-article-header');
    await waitFor(() =>
      expect(
        within(header).getByRole('button', { name: 'Save post' }),
      ).toBeEnabled(),
    );
    expect(within(header).getByRole('button', { name: /Share/ })).toBeVisible();
  });

  it('checks the bookmark status of this post', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);

    await setup();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled(),
    );
    expect(getBookmarkStatus).toHaveBeenCalledWith(mockPostDetail.id);
  });

  it('renders no bookmark toggle when bookmarks are not enabled', async () => {
    await setup();

    expect(
      screen.queryByRole('button', { name: 'Save post' }),
    ).not.toBeInTheDocument();
  });

  it('renders the published date (year/month/day) and the reading time', async () => {
    await setup();

    expect(screen.getByText('January 15, 2026')).toBeVisible();
    expect(screen.getByText('4 min read')).toBeVisible();
  });

  it('links the topic eyebrow and the author name to their routes', async () => {
    await setup();

    const topicLinks = screen.getAllByRole('link', { name: 'Engineering' });
    expect(topicLinks.length).toBeGreaterThan(0);
    topicLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/topics/engineering');
    });
    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/jane-doe',
    );
  });

  it('links the author to whatever href the service resolved', async () => {
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockPostDetail,
        author: {
          ...mockPostDetail.author,
          profileUrl: '/blog/tag/writers',
        },
      },
    });

    await setup();

    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/blog/tag/writers',
    );
  });

  it('renders the share widget with an X and a LinkedIn link', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    expect(screen.getByRole('menuitem', { name: /Share on X/ })).toBeVisible();
    expect(
      screen.getByRole('menuitem', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
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
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: { ...mockPostDetail, heroImage },
    });

    await setup();

    expect(screen.getByRole('img', { name: heroImage.alt })).toBeVisible();
  });

  it('builds the author avatar at a fixed 64x64 crop, not the full-size asset', async () => {
    await setup();

    const expectedAvatarUrl = urlForSanityImage(
      POST_DETAIL_AUTHOR_IMAGE,
      DEFAULT_TENANT_SANITY_CONTEXT,
      { width: 64, height: 64, fit: 'crop', quality: 75 },
    );

    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      expectedAvatarUrl,
    );
  });

  it('renders no contents rail when the body has fewer than 3 H2 headings', async () => {
    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders the contents rail once the body has 3+ H2 headings', async () => {
    const body: TPortableTextBody = [
      portableTextBlock('Getting started', { style: 'h2' }),
      portableTextBlock('Intro.'),
      portableTextBlock('Configuration', { style: 'h2', key: 'configuration' }),
      portableTextBlock('Deployment', { style: 'h2' }),
    ];
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: { ...mockPostDetail, body },
    });

    await setup();

    const rail = screen.getByRole('navigation', { name: 'Topics' });
    expect(
      within(rail).getByRole('link', { name: 'Configuration' }),
    ).toHaveAttribute('href', '#configuration');
  });

  it('renders the post tags as links to routes.tag(slug)', async () => {
    getPostMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockPostDetail,
        tags: [
          { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
          { id: 'tag-2', title: 'React', slug: 'react' },
        ],
      },
    });

    await setup();

    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tags/typescript',
    );
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute(
      'href',
      '/tags/react',
    );
  });

  it('renders no tag chips when the post has no tags', async () => {
    await setup();

    expect(
      screen.queryByRole('link', { name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });
});
