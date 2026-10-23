import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation');

const tenant: TTenantSwitcherItem = {
  id: TENANT_ID,
  name: 'Acme Inc.',
  primaryDomain: MOCK_TENANT_DOMAIN,
  isArchived: false,
};

const archivedTenant: TTenantSwitcherItem = {
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
  primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
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
    ).toHaveTextContent(MOCK_TENANT_DOMAIN);
  });

  describe('with the menu open', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      setup({ tenants: [tenant, archivedTenant] });
      await user.click(screen.getByRole('button', { name: /acme inc\./i }));
      menu = await screen.findByRole('menu', { name: /acme inc\./i });
    });

    it('opens a menu named for the active tenant, linking every tenant through the select-tenant endpoint', () => {
      expect(
        within(menu).getByRole('menuitem', { name: /acme inc\./i }),
      ).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${TENANT_ID}`,
      );
      expect(
        within(menu).getByRole('menuitem', { name: /globex corp/i }),
      ).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${MOCK_OTHER_TENANT_ID}`,
      );
    });

    it('marks an archived tenant in its accessible name and leaves others unmarked', () => {
      expect(
        within(menu).getByRole('menuitem', { name: /acme inc\./i }),
      ).not.toHaveAccessibleName(/archived/i);
      expect(
        within(menu).getByRole('menuitem', { name: /globex corp.*archived/i }),
      ).toBeVisible();
    });
  });

  it('shows the archived marker on the trigger when the active tenant is archived', () => {
    setup({
      tenants: [tenant, archivedTenant],
      activeTenantId: MOCK_OTHER_TENANT_ID,
    });

    expect(
      screen.getByRole('button', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });
});
