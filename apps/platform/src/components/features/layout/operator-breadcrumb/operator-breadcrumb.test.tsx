import { usePathname } from '@platform/i18n/navigation';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { ComponentPropsWithoutRef } from 'react';

import { OperatorBreadcrumb } from './operator-breadcrumb';

// Links through `@platform/i18n/navigation`'s `Link`/`usePathname`, mocked the
// same way as `sidebar.test.tsx`/`topbar-nav-menu.test.tsx`.
vi.mock('@platform/i18n/navigation', () => ({
  usePathname: vi.fn(() => '/tenants'),
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const render = renderWithIntl;

describe(OperatorBreadcrumb, () => {
  it('renders the 2-segment trail on the tenants list, with Tenants as the current item', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants');

    render(<OperatorBreadcrumb />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Platform' })).toBeNull();
    expect(screen.getByText('Tenants')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Tenants' })).toBeNull();
  });

  it('renders a 3-segment trail with a linked Tenants on the add-tenant route', () => {
    vi.mocked(usePathname).mockReturnValue('/tenants/new');

    render(<OperatorBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
    expect(screen.getByText('Add tenant')).toBeVisible();
  });
});
