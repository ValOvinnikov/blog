import { screen, within } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import {
  testBreadcrumbsJsonLdSchema,
  testNoJsonLdWithoutBaseUrl,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { DEFAULT_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';

interface IStaticBreadcrumbsContractOptions {
  setup: TAsyncSetup;
  label: string;
  path: string;
}

export const testStaticBreadcrumbsContract = ({
  setup,
  label,
  path,
}: IStaticBreadcrumbsContractOptions) => {
  it(`renders the home › ${label} breadcrumbs trail`, async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', {
      name: DEFAULT_SITE_SETTINGS.brand.name,
    });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText(label);
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  testBreadcrumbsJsonLdSchema({ setup, itemPath: path });
  testNoJsonLdWithoutBaseUrl({ setup });
};
