import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';
import { notFound } from 'next/navigation';

import { LandingBreadcrumbs } from './landing-breadcrumbs';

const { getLandingPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
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

const setup = customRenderAsync(LandingBreadcrumbs, {
  slug: 'about-us',
  tenant: 'tenant-1',
});

describe(LandingBreadcrumbs, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  it('calls notFound() without logging when no page_landing matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('landing_breadcrumbs.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('renders the Home › {title} breadcrumbs trail', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('About Us');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain(
      '"item":"https://example.com/about-us"',
    );
  });

  it('forwards the slug and tenant to getLandingPage', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await setup();

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us', 'tenant-1');
  });
});
