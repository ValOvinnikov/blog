import userEvent from '@testing-library/user-event';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';

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

const setup = customRenderAsync(BlogPostPage, {
  slug: 'hello-world',
  locale: 'EN',
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the post does not exist', async () => {
    getPostMock.mockResolvedValue(null);

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
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

  it('omits PostMeta when the post has no author', async () => {
    getPostMock.mockResolvedValue({ ...mockPostDetail, author: undefined });

    await setup();

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
