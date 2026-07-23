import userEvent from '@testing-library/user-event';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

const { getPostMock } = vi.hoisted(() => ({
  getPostMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPost: getPostMock } },
    },
  },
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

const setup = customRenderAsync(BlogPostPage, {
  slug: 'hello-world',
  locale: 'EN',
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockReset();
  });

  it('calls notFound() when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the post title, meta, body, categories, and share links', async () => {
    getPostMock.mockResolvedValue(mockPostDetail);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
    expect(screen.getByText('Jane Doe')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Share/ }));
    expect(screen.getByRole('menuitem', { name: /Share on X/ })).toBeVisible();
    expect(
      screen.getByRole('menuitem', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
  });

  it('renders the JSON-LD BlogPosting schema script', async () => {
    getPostMock.mockResolvedValue(mockPostDetail);

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BlogPosting"');
  });

  it('renders the post tags as links to routes.tag(slug)', async () => {
    getPostMock.mockResolvedValue({
      ...mockPostDetail,
      tags: [
        { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
        { id: 'tag-2', title: 'React', slug: 'react' },
      ],
    });

    await setup();

    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tag/typescript',
    );
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute(
      'href',
      '/tag/react',
    );
  });

  it('renders no tag chips when the post has no tags', async () => {
    getPostMock.mockResolvedValue({ ...mockPostDetail, tags: [] });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });

  it('renders a "Related posts" section when relatedPosts is non-empty', async () => {
    getPostMock.mockResolvedValue({
      ...mockPostDetail,
      relatedPosts: [
        {
          id: 'related-1',
          title: 'A Related Post',
          slug: 'a-related-post',
          excerpt: 'A related excerpt.',
          publishedAt: '2026-01-10T00:00:00.000Z',
          heroImageUrl: undefined,
          heroImageAlt: undefined,
          heroImageSanity: undefined,
          featured: false,
          author: undefined,
          categories: [],
        },
      ],
    });

    await setup();

    expect(screen.getByText('Related posts')).toBeVisible();
    const link = screen.getByRole('link', { name: 'A Related Post' });
    expect(link).toHaveAttribute('href', '/blog/a-related-post');
  });

  it('omits the "Related posts" section when relatedPosts is empty', async () => {
    getPostMock.mockResolvedValue({ ...mockPostDetail, relatedPosts: [] });

    await setup();

    expect(screen.queryByText('Related posts')).not.toBeInTheDocument();
  });
});
