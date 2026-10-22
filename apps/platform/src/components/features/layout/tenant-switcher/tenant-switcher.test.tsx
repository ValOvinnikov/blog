import { customRender, screen, within } from '@platform/testing/custom-render';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation');

const ACME_EXAMPLE_COM = 'acme.example.com';

const tenant: TTenantSwitcherItem = {
  id: TENANT_ID,
  name: 'Acme Inc.',
  primaryDomain: ACME_EXAMPLE_COM,
  isArchived: false,
};

const archivedTenant: TTenantSwitcherItem = {
  id: 'tenant-2',
  name: 'Globex Corp',
  primaryDomain: 'globex.example.com',
  isArchived: true,
};

const setup = customRender(TenantSwitcher, {
  tenants: [tenant],
  activeTenantId: TENANT_ID,
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
    ).toHaveTextContent(ACME_EXAMPLE_COM);
  });

  it('opens a menu named for the active tenant, linking every tenant through the select-tenant endpoint', async () => {
    setup({ tenants: [tenant, archivedTenant] });

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    expect(
      within(menu).getByRole('menuitem', { name: /acme inc\./i }),
    ).toHaveAttribute(
      'href',
      `/api/dashboard/select-tenant?tenantId=${TENANT_ID}`,
    );
    expect(
      within(menu).getByRole('menuitem', { name: /globex corp/i }),
    ).toHaveAttribute('href', '/api/dashboard/select-tenant?tenantId=tenant-2');
  });

  it('marks an archived tenant in its accessible name and leaves others unmarked', async () => {
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
    setup({ tenants: [tenant, archivedTenant], activeTenantId: 'tenant-2' });

    expect(
      screen.getByRole('button', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });
});
