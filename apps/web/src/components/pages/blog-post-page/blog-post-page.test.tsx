import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

const { getPostPageMock } = vi.hoisted(() => ({ getPostPageMock: vi.fn() }));

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

// The remaining self-fetching parts are all async Server Components — real
// RSC async-component nesting isn't renderable through
// `@testing-library/react`'s client renderer (`blog-list-page.test.tsx`
// follows the same pattern). Each is stubbed as a plain sync component
// rendering its own testid plus the `slug`/`tenant` it received, so this
// suite can assert `BlogPostPage` composes them in the right order with the
// right props, without needing a real async render; each part's own
// behavior is covered by its own test file.
vi.mock('@web/components/features/post/blog-posting-schema', () => ({
  BlogPostingSchema: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="blog-posting-schema">
      {slug}:{tenant}
    </div>
  ),
}));

vi.mock('@web/components/features/post/post-breadcrumbs', () => ({
  PostBreadcrumbs: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="post-breadcrumbs">
      {slug}:{tenant}
    </div>
  ),
}));

vi.mock('@web/components/features/post/post-article', () => ({
  PostArticle: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="post-article">
      {slug}:{tenant}
    </div>
  ),
}));

vi.mock('@web/components/shared/skim-panel', () => ({
  SkimPanel: () => <div data-testid="skim-panel" />,
}));

vi.mock('@web/components/features/post/post-related', () => ({
  PostRelated: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="post-related">
      {slug}:{tenant}
    </div>
  ),
}));

vi.mock('@web/components/features/post/post-newsletter', () => ({
  PostNewsletter: ({ slug, tenant }: { slug: string; tenant: string }) => (
    <div data-testid="post-newsletter">
      {slug}:{tenant}
    </div>
  ),
}));

const setup = customRenderAsync(BlogPostPage, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(BlogPostPage, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

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

  it('renders the parts in order: schema, breadcrumbs, article, skim panel, related reading, newsletter', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    const { container } = await setup();

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual([
      'blog-posting-schema',
      'post-breadcrumbs',
      'post-article',
      'skim-panel',
      'post-related',
      'post-newsletter',
    ]);
  });

  it('forwards the slug and tenant to every part', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByTestId('blog-posting-schema')).toHaveTextContent(
      'hello-world:tenant-1',
    );
    expect(screen.getByTestId('post-breadcrumbs')).toHaveTextContent(
      'hello-world:tenant-1',
    );
    expect(screen.getByTestId('post-article')).toHaveTextContent(
      'hello-world:tenant-1',
    );
    expect(screen.getByTestId('post-related')).toHaveTextContent(
      'hello-world:tenant-1',
    );
    expect(screen.getByTestId('post-newsletter')).toHaveTextContent(
      'hello-world:tenant-1',
    );
  });

  it('renders no reading-depth control when the post has neither a skim nor asides', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders the reading-depth control once the post has asides', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, hasAsides: true },
    });

    await setup();

    expect(screen.getByRole('radio', { name: 'Deep' })).toBeInTheDocument();
  });

  it('renders the reading-depth control with the 30s option once the post has an approved skim', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        skim: {
          takeaways: ['First.', 'Second.', 'Third.'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          model: 'claude-haiku-4-5',
        },
      },
    });

    await setup();

    expect(screen.getByRole('radio', { name: '30s' })).toBeInTheDocument();
  });

  it('forwards the resolved slug/tenant to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world', 'tenant-1');
  });
});
