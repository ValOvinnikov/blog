import type { RenderResult } from '@testing-library/react';
import { screen, within } from '@web/testing/custom-render';
import type { Mock } from 'vitest';

interface IStaticBreadcrumbsContractOptions {
  setup: (overrides?: Record<string, unknown>) => Promise<RenderResult>;
  getTenantBaseUrlMock: Mock;
  label: string;
  path: string;
}

export const testStaticBreadcrumbsContract = ({
  setup,
  getTenantBaseUrlMock,
  label,
  path,
}: IStaticBreadcrumbsContractOptions) => {
  it(`renders the Home › ${label} breadcrumbs trail`, async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText(label);
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
    expect(script?.textContent).toContain(
      `"item":"https://example.com${path}"`,
    );
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
};
