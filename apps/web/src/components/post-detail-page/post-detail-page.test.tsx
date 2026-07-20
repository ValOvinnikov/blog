import type { TPostDetail } from '@blog/service';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostDetailPage } from './post-detail-page';

const { getPostMock } = vi.hoisted(() => ({
  getPostMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPost: getPostMock } },
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@web/utils/env/env', () => ({
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
}));

vi.mock('@web/components/smart-link/smart-link', () => ({
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

const post: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: 'https://cdn.example.com/hero.jpg',
  heroImageAlt: 'A hero image',
  heroImageSanity: undefined,
  featured: false,
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body text.' }],
    },
  ],
  seo: undefined,
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: 'https://cdn.example.com/jane.jpg',
    role: 'Writer',
    bio: [
      {
        _type: 'block',
        _key: 'bio1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'bio1s', text: 'A short bio.' }],
      },
    ],
    socialLinks: [],
  },
  categories: [
    {
      id: 'cat-1',
      title: 'Engineering',
      slug: 'engineering',
      description: undefined,
    },
  ],
};

describe(`<${PostDetailPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    await expect(
      PostDetailPage({ slug: 'missing', locale: 'EN' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the post title, meta, body, categories, share links, and author byline', async () => {
    getPostMock.mockResolvedValue(post);

    const ui = await PostDetailPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByText('Engineering')).toBeVisible();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('A short bio.')).toBeVisible();
    expect(screen.getByRole('link', { name: /Share on X/ })).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
  });

  it('renders the JSON-LD BlogPosting schema script', async () => {
    getPostMock.mockResolvedValue(post);

    const ui = await PostDetailPage({ slug: 'hello-world', locale: 'EN' });
    const { container } = render(<>{ui}</>);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BlogPosting"');
  });

  it('omits PostMeta and AuthorByline when the post has no author', async () => {
    getPostMock.mockResolvedValue({ ...post, author: undefined });

    const ui = await PostDetailPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
