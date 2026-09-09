import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

import { TagBreadcrumbs } from './tag-breadcrumbs';

const { getTagPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page', () => ({
  getTagPage: getTagPageMock,
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

const tag = makeTag({ title: 'TypeScript', slug: 'typescript' });

const setup = customRenderAsync(TagBreadcrumbs, {
  slug: 'typescript',
  tenant: 'tenant-1',
});

describe(`<${TagBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('calls notFound() without logging when no page_tag matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tag_breadcrumbs.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('renders the Home › {tag} breadcrumbs trail', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('TypeScript');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain(
      '"item":"https://example.com/tags/typescript"',
    );
  });

  it('renders no JSON-LD script when the base URL cannot be resolved', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const { container } = await setup();

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument();
  });

  it('forwards the slug and tenant to getTagPage', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: { tag, modules: [], seo: {}, postListId: 'post-list-1' },
    });

    await setup();

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', 'tenant-1');
  });
});
