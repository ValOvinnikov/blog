import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';

import { AdminShell } from './admin-shell';

const render = renderWithIntl;

describe(AdminShell, () => {
  it('renders the sidebar, topbar and page content together', () => {
    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        crumb="Platform"
        roleLabel="ADMIN"
      >
        <p>Tenants page</p>
      </AdminShell>,
    );

    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Platform section')).toBeVisible();
    expect(screen.getByText('Platform', { selector: 'p' })).toBeVisible();
    expect(screen.getByText('ADMIN')).toBeVisible();
    expect(screen.getByText('Tenants page')).toBeVisible();
  });
});
