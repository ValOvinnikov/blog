import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import { notFound } from 'next/navigation';

import { PostBreadcrumbs } from './post-breadcrumbs';

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

const setup = customRenderAsync(PostBreadcrumbs, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(PostBreadcrumbs, () => {
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

  it('renders the Home › Topic › Post breadcrumbs trail', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const topicLink = within(nav).getByRole('link', { name: 'Engineering' });
    expect(topicLink).toHaveAttribute('href', '/topics/engineering');

    const current = within(nav).getByText('Hello World');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the Home › Post trail (no topic crumb) for a sparse post with no topic, without throwing', async () => {
    getPostPageMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, topic: undefined },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(nav).getByRole('link', { name: 'Home' })).toBeVisible();
    expect(
      within(nav).queryByRole('link', { name: 'Engineering' }),
    ).not.toBeInTheDocument();
    expect(within(nav).getByText('Hello World')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain(
      '"item":"https://example.com/topics/engineering"',
    );
  });

  it('forwards the slug and tenant to getPostPage', async () => {
    getPostPageMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(getPostPageMock).toHaveBeenCalledWith('hello-world', 'tenant-1');
  });
});
