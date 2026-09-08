import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeTopic } from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import { TopicBreadcrumbs } from './topic-breadcrumbs';

const { getTopicPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
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

const topic = makeTopic({ title: 'News', slug: 'news' });

const setup = customRenderAsync(TopicBreadcrumbs, {
  slug: 'news',
  tenant: 'tenant-1',
});

describe(TopicBreadcrumbs, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('calls notFound() without logging when no page_topic matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('topic_breadcrumbs.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('renders the Home › {topic} breadcrumbs trail', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('News');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain(
      '"item":"https://example.com/topics/news"',
    );
  });

  it('renders no JSON-LD script when the base URL cannot be resolved', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const { container } = await setup();

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument();
  });

  it('forwards the slug and tenant to getTopicPage', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: { topic, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(getTopicPageMock).toHaveBeenCalledWith('news', 'tenant-1');
  });
});
