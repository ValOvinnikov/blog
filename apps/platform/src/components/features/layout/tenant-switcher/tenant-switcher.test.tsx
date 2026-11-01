import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import userEvent from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation');

const MOCK_ACTIVE_TENANT: TTenantSwitcherItem = {
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  isArchived: false,
};

const MOCK_ARCHIVED_TENANT: TTenantSwitcherItem = {
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
  primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
  isArchived: true,
};

const ACTIVE_TENANT_NAME = `${MOCK_TENANT_NAME}${MOCK_TENANT_DOMAIN}`;
const ARCHIVED_TENANT_NAME = `${MOCK_OTHER_TENANT_NAME}${messages.tenantSwitcher.archived}${MOCK_OTHER_TENANT_DOMAIN}`;

const setup = customRender(TenantSwitcher, {
  tenants: [MOCK_ACTIVE_TENANT, MOCK_ARCHIVED_TENANT],
  activeTenantId: MOCK_TENANT_ID,
});

describe(`<${TenantSwitcher.name}/>`, () => {
  it.each([
    { activeTenantId: MOCK_TENANT_ID, name: ACTIVE_TENANT_NAME },
    { activeTenantId: MOCK_OTHER_TENANT_ID, name: ARCHIVED_TENANT_NAME },
  ])(
    'names its trigger for the active tenant $name',
    ({ activeTenantId, name }) => {
      setup({ activeTenantId });

      const trigger = screen.getByRole('button', { name });

      expect(trigger).toBeVisible();
    },
  );

  it.each([
    { activeTenantId: MOCK_TENANT_ID, title: MOCK_TENANT_NAME },
    { activeTenantId: MOCK_OTHER_TENANT_ID, title: MOCK_OTHER_TENANT_NAME },
  ])(
    'describes its trigger with the full active workspace name $title',
    ({ activeTenantId, title }) => {
      setup({ activeTenantId });

      const trigger = screen.getByRole('button', { description: title });

      expect(trigger).toBeVisible();
    },
  );

  describe('with the menu open', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      const user = userEvent.setup();
      setup();

      const trigger = screen.getByRole('button', { name: ACTIVE_TENANT_NAME });
      await user.click(trigger);
      menu = await screen.findByRole('menu', { name: ACTIVE_TENANT_NAME });
    });

    it.each([
      { name: ACTIVE_TENANT_NAME, tenantId: MOCK_TENANT_ID },
      { name: ARCHIVED_TENANT_NAME, tenantId: MOCK_OTHER_TENANT_ID },
    ])(
      'links $name through the select-tenant endpoint',
      ({ name, tenantId }) => {
        const item = within(menu).getByRole('menuitem', { name });

        expect(item).toHaveAttribute(
          'href',
          adminRoutes.dashboardSelectTenantHref(tenantId),
        );
      },
    );
  });
});
