import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation');

const tenant: TTenantSwitcherItem = {
  id: TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  isArchived: false,
};

const archivedTenant: TTenantSwitcherItem = {
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
  primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
  isArchived: true,
};

const includesTenantName = (accessibleName: string) =>
  accessibleName.includes(MOCK_TENANT_NAME);

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

    const trigger = screen.getByRole('button', { name: includesTenantName });

    expect(trigger).toHaveTextContent(MOCK_TENANT_DOMAIN);
  });

  describe('with the menu open', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      setup({ tenants: [tenant, archivedTenant] });
      const trigger = screen.getByRole('button', { name: includesTenantName });
      await user.click(trigger);
      menu = await screen.findByRole('menu', { name: includesTenantName });
    });

    it('opens a menu named for the active tenant, linking every tenant through the select-tenant endpoint', () => {
      const activeItem = within(menu).getByRole('menuitem', {
        name: includesTenantName,
      });
      const otherItem = within(menu).getByRole('menuitem', {
        name: /globex corp/i,
      });

      expect(activeItem).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${TENANT_ID}`,
      );
      expect(otherItem).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${MOCK_OTHER_TENANT_ID}`,
      );
    });

    it('marks an archived tenant in its accessible name and leaves others unmarked', () => {
      const activeItem = within(menu).getByRole('menuitem', {
        name: includesTenantName,
      });
      const archivedItem = within(menu).getByRole('menuitem', {
        name: /globex corp.*archived/i,
      });

      expect(activeItem).not.toHaveAccessibleName(/archived/i);
      expect(archivedItem).toBeVisible();
    });
  });

  it('shows the archived marker on the trigger when the active tenant is archived', () => {
    setup({
      tenants: [tenant, archivedTenant],
      activeTenantId: MOCK_OTHER_TENANT_ID,
    });

    const trigger = screen.getByRole('button', {
      name: /globex corp.*archived/i,
    });

    expect(trigger).toBeVisible();
  });
});
