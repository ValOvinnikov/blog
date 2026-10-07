import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  makeReadyTenant,
  makeTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation');

const tenant = makeReadyTenant();

const setup = customRender(TenantSwitcher, {
  tenants: [tenant],
  activeTenantId: 'tenant-1',
});

describe(`<${TenantSwitcher.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the active tenant on the trigger', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /acme inc\./i }),
    ).toHaveTextContent('acme.example.com');
  });

  it('opens a menu named for the active tenant, linking every switchable tenant', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute('href', '/tenants/tenant-1');
  });

  it('links each tenant through a caller-supplied hrefFor instead of /tenants/{id}', async () => {
    setup({
      hrefFor: (t) => `/dashboard/select-tenant?tenantId=${t.id}`,
    });

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute(
      'href',
      '/dashboard/select-tenant?tenantId=tenant-1',
    );
  });

  it('marks an archived tenant in its accessible name and leaves others unmarked', async () => {
    const archivedTenant = makeTenant({
      id: 'tenant-2',
      name: 'Globex Corp',
      primaryDomain: 'globex.example.com',
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    setup({ tenants: [tenant, archivedTenant] });

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    expect(
      within(menu).getByRole('menuitem', { name: /acme inc\./i }),
    ).not.toHaveAccessibleName(/archived/i);
    expect(
      within(menu).getByRole('menuitem', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });

  it('shows the archived marker on the trigger when the active tenant is archived', () => {
    const archivedTenant = makeTenant({
      id: 'tenant-2',
      name: 'Globex Corp',
      primaryDomain: 'globex.example.com',
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    setup({ tenants: [tenant, archivedTenant], activeTenantId: 'tenant-2' });

    expect(
      screen.getByRole('button', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });
});
