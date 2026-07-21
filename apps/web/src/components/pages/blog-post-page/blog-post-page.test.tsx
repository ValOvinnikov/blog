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
  env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
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

  it('renders the post title, meta, body, categories, share links, and author byline', async () => {
    getPostMock.mockResolvedValue(mockPostDetail);

    const ui = await BlogPostPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByText('Engineering')).toBeVisible();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('A short bio.')).toBeVisible();

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

  it('omits PostMeta and AuthorByline when the post has no author', async () => {
    getPostMock.mockResolvedValue({ ...mockPostDetail, author: undefined });

    const ui = await BlogPostPage({ slug: 'hello-world', locale: 'EN' });
    render(<>{ui}</>);

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
