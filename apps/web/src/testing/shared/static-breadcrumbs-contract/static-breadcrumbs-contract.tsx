import { screen, within } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import {
  testBreadcrumbsJsonLdSchema,
  testNoJsonLdWithoutBaseUrl,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import type { Mock } from 'vitest';

interface IStaticBreadcrumbsContractOptions {
  setup: TAsyncSetup;
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

  testBreadcrumbsJsonLdSchema({ setup, itemPath: path });
  testNoJsonLdWithoutBaseUrl({ setup, getTenantBaseUrlMock });

  it('forwards the tenant to getTenantBaseUrl', async () => {
    await setup();

    expect(getTenantBaseUrlMock).toHaveBeenCalledWith('tenant-1');
  });
};
