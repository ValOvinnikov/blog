import type { ISanityImage } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { PostRelated } from './post-related';

const { getPostPageMock } = vi.hoisted(() => ({ getPostPageMock: vi.fn() }));

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
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

const relatedPost = {
  id: 'related-1',
  title: 'A Related Post',
  slug: 'a-related-post',
  excerpt: 'A related excerpt.',
  publishedAt: '2026-01-10T00:00:00.000Z',
  heroImageUrl: undefined,
  heroImageAlt: undefined,
  heroImageSanity: undefined,
  featured: false,
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profilePageSlug: 'jane-doe',
    imageUrl: undefined,
  },
  topic: {
    id: 'topic-2',
    title: 'Design',
    slug: 'design',
  },
  readingTimeMinutes: 3,
};

const setup = customRenderAsync(PostRelated, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(PostRelated, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
  });

  it('calls notFound() without logging when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('renders nothing when relatedPosts is empty', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, relatedPosts: [] },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a "Related reading" section with each related post, even when a related post is in a different topic', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, relatedPosts: [relatedPost] },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Related reading' }),
    ).toBeVisible();
    const link = screen.getByRole('link', { name: 'A Related Post' });
    expect(link).toHaveAttribute('href', '/blog/a-related-post');
  });

  it("renders a related post's hero image unconditionally, with no priority hint", async () => {
    const heroImageSanity: ISanityImage = {
      assetId: 'image-abc123-800x600-jpg',
      alt: 'A related post hero image',
      hotspot: undefined,
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 800, height: 600, aspectRatio: 800 / 600 },
      cdnBaseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
    };
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        relatedPosts: [{ ...relatedPost, heroImageSanity }],
      },
    });

    await setup();

    const img = screen.getByRole('img', { name: heroImageSanity.alt });
    expect(img).not.toHaveAttribute('fetchpriority');
  });

  it('forwards the slug and tenant to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, relatedPosts: [relatedPost] },
    });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world', 'tenant-1');
  });
});
