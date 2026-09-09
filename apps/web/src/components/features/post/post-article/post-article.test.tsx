import type { ISanityImage, TPortableTextBody } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import {
  richTextBlock,
  richTextSpan,
} from '@web/testing/shared/portable-text-renderer/fixtures';
import { notFound } from 'next/navigation';

import { PostArticle } from './post-article';

const { getPostPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

// `BookmarkButtonGate` is itself an async Server Component — real RSC
// async-component nesting inside another async component isn't renderable
// through `@testing-library/react`'s client renderer. Stubbed as a plain
// sync component rendering the `postId` it received, so this suite can
// assert `PostArticle` composes it correctly; its own capability-gating
// behavior is covered by `bookmark-button-gate.test.tsx`.
vi.mock('@web/components/features/post/bookmark-button-gate', () => ({
  BookmarkButtonGate: ({ postId }: { postId: string }) => (
    <div data-testid="bookmark-button-gate">{postId}</div>
  ),
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

const setup = customRenderAsync(PostArticle, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(`<${PostArticle.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('renders the post title, lead, author, and body', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

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

  it('renders the bookmark button and share links in the header meta strip even for a post with no tags or hero image', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, tags: [], heroImageSanity: undefined },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Hello World',
    });
    const header = heading.closest('header');
    expect(header).not.toBeNull();

    expect(
      within(header as HTMLElement).getByTestId('bookmark-button-gate'),
    ).toBeVisible();
    expect(
      within(header as HTMLElement).getByRole('button', { name: /Share/ }),
    ).toBeVisible();
  });

  it('renders the published date formatted via next-intl (year/month/day) and the reading time', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByText('January 15, 2026')).toBeVisible();
    expect(screen.getByText('4 min read')).toBeVisible();
  });

  it('links the topic eyebrow and the author name to their routes', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

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

  it('renders BookmarkButtonGate beside the share widget, forwarding the post id', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByTestId('bookmark-button-gate')).toHaveTextContent(
      mockPostDetail.id,
    );
  });

  it('renders the share widget with an X and a LinkedIn link', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();
    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    expect(screen.getByRole('menuitem', { name: /Share on X/ })).toBeVisible();
    expect(
      screen.getByRole('menuitem', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
  });

  it('renders the hero image using its own cdnBaseUrl, not a hardcoded origin', async () => {
    const heroImageSanity: ISanityImage = {
      assetId: 'image-abc123-1600x1200-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
      cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-project/production/',
    };
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, heroImageSanity },
    });

    await setup();

    const img = screen.getByRole('img', { name: mockPostDetail.heroImageAlt });
    expect(img.getAttribute('src')).toContain('tenant-project/production');
  });

  it('renders no PostContentsRail (and stays single-column) when the body has fewer than 3 H2 headings', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders PostContentsRail once the body has 3+ H2 headings', async () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro.')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];
    getPostPageMock.mockResolvedValue({
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
    getPostPageMock.mockResolvedValue({
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
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, tags: [] },
    });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });
});
