import type { TTenant } from '@blog/db/schema/tenants';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { DashboardTenantPicker } from './dashboard-tenant-picker';

const render = renderWithIntl;

const tenants = [
  {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme Inc.',
    primaryDomain: 'acme.example.com',
  },
  {
    id: 'tenant-2',
    slug: 'globex',
    name: 'Globex Corp.',
    primaryDomain: 'globex.example.com',
  },
] as TTenant[];

describe(DashboardTenantPicker, () => {
  it('renders a heading and every tenant, linked through the select-tenant endpoint', async () => {
    const user = userEvent.setup();
    render(<DashboardTenantPicker tenants={tenants} />);

    expect(
      screen.getByRole('heading', { name: 'Choose a workspace' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: /acme/i }));
    const menu = await screen.findByRole('menu');

    const acmeLink = within(menu).getByRole('menuitem', { name: /acme/i });
    const globexLink = within(menu).getByRole('menuitem', {
      name: /globex/i,
    });
    expect(acmeLink).toHaveAttribute(
      'href',
      '/api/dashboard/select-tenant?tenantId=tenant-1',
    );
    expect(globexLink).toHaveAttribute(
      'href',
      '/api/dashboard/select-tenant?tenantId=tenant-2',
    );
  });

  it('renders nothing for an empty tenant list', () => {
    render(<DashboardTenantPicker tenants={[]} />);

    // Not `container` — `renderWithIntl` always mounts the app's
    // `ToastProvider` alongside whatever the component under test renders,
    // so an empty-render assertion has to target the component's own
    // output, not the whole render tree.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
