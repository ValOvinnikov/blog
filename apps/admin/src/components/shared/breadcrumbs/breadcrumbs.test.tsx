import { render, screen } from '@admin/testing/custom-render';
import type { ComponentPropsWithoutRef } from 'react';

import { Breadcrumbs } from './breadcrumbs';

// `Breadcrumbs` links through `@admin/i18n/navigation`'s `Link`, which needs
// real routing context this test environment doesn't provide — mocked the
// same way `link-button.test.tsx`/`sidebar.test.tsx` do for their own links.
vi.mock('@admin/i18n/navigation', () => ({
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

describe(Breadcrumbs, () => {
  it('renders every ancestor with an href as a real link', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[
          { label: 'Platform' },
          { label: 'Tenants', href: '/tenants' },
          { label: 'Acme Inc.' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
  });

  it('renders the last item as the current, non-clickable label even when it has an href', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[
          { label: 'Your site', href: '/dashboard' },
          { label: 'Look', href: '/dashboard/look' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Your site' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(
      screen.queryByRole('link', { name: 'Look' }),
    ).not.toBeInTheDocument();
    const current = screen.getByText('Look');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders an ancestor with no href as a non-clickable label, not a link', () => {
    render(
      <Breadcrumbs
        ariaLabel="Breadcrumb"
        items={[{ label: 'Platform' }, { label: 'Tenants' }]}
      />,
    );

    expect(
      screen.queryByRole('link', { name: 'Platform' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Platform')).not.toHaveAttribute('aria-current');
  });

  it('renders a nav landmark labelled with the given ariaLabel', () => {
    render(
      <Breadcrumbs ariaLabel="Breadcrumb" items={[{ label: 'Platform' }]} />,
    );

    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
  });
});
