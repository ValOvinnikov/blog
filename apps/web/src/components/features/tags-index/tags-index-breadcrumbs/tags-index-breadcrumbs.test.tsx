import { customRenderAsync, screen, within } from '@web/testing/custom-render';

import { TagsIndexBreadcrumbs } from './tags-index-breadcrumbs';

const { getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTenantBaseUrlMock: vi.fn(),
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

const setup = customRenderAsync(TagsIndexBreadcrumbs, { tenant: 'tenant-1' });

describe(`<${TagsIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('renders the Home › Tags breadcrumbs trail', async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Tags');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain('"item":"https://example.com/tags"');
  });

  it('renders no JSON-LD script when the base URL cannot be resolved', async () => {
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const { container } = await setup();

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument();
  });

  it('forwards the tenant to getTenantBaseUrl', async () => {
    await setup();

    expect(getTenantBaseUrlMock).toHaveBeenCalledWith('tenant-1');
  });
});
