import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogPostPage } from './blog-post-page';

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
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
    NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
    NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
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

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    await expect(
      BlogPostPage({ slug: 'missing', locale: 'EN' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the article landmark with title, eyebrow category link, meta, and body', async () => {
    getPostMock.mockResolvedValue(mockPostDetail);

    const ui = await BlogPostPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(screen.getByRole('article')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();

    const categoryLinks = screen.getAllByRole('link', { name: 'Engineering' });
    expect(categoryLinks).toHaveLength(mockPostDetail.categories.length);
    categoryLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/category/engineering'),
    );

    expect(screen.getByText('Jane Doe')).toBeVisible();
    expect(screen.getByAltText('A hero image')).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Share/ }));
    expect(screen.getByRole('menuitem', { name: /Share on X/ })).toBeVisible();
    expect(
      screen.getByRole('menuitem', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
  });

  it('renders the JSON-LD BlogPosting schema script', async () => {
    getPostMock.mockResolvedValue(mockPostDetail);

    const ui = await BlogPostPage({ slug: 'hello-world', locale: 'EN' });
    const { container } = render(<>{ui}</>);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BlogPosting"');
  });

  it('omits PostMeta when the post has no author', async () => {
    getPostMock.mockResolvedValue({ ...mockPostDetail, author: undefined });

    const ui = await BlogPostPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
