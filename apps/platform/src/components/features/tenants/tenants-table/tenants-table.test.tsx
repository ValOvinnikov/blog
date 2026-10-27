import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockReadyTenant,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { TenantsTable } from './tenants-table';

const setup = customRender(TenantsTable, { tenants: [mockReadyTenant()] });

const otherTenant = (overrides: Partial<TTenant> = {}) =>
  mockReadyTenant({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    ...overrides,
  });

const MANAGE_TENANT = `Manage ${MOCK_TENANT_NAME}`;
const MANAGE_OTHER_TENANT = `Manage ${MOCK_OTHER_TENANT_NAME}`;

describe(`<${TenantsTable.name}/>`, () => {
  it("shows each tenant's name, domain, plan and status", () => {
    setup({
      tenants: [
        mockReadyTenant(),
        otherTenant({
          plan: TENANT_PLAN.GROWTH,
          status: TENANT_STATUS.SUSPENDED,
        }),
      ],
    });

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantDomain = screen.getByText(MOCK_TENANT_DOMAIN);
    const freePlan = screen.getByText('Free');
    const activeStatus = screen.getByText('Active');
    const otherName = screen.getByText(MOCK_OTHER_TENANT_NAME);
    const growthPlan = screen.getByText('Growth');
    const suspendedStatus = screen.getByText('Suspended');

    expect(tenantName).toBeVisible();
    expect(tenantDomain).toBeVisible();
    expect(freePlan).toBeVisible();
    expect(activeStatus).toBeVisible();
    expect(otherName).toBeVisible();
    expect(growthPlan).toBeVisible();
    expect(suspendedStatus).toBeVisible();
  });

  it('links a ready tenant to its overview page', () => {
    setup({ tenants: [mockReadyTenant(), otherTenant()] });

    const tenantLink = screen.getByRole('link', { name: MANAGE_TENANT });
    const otherLink = screen.getByRole('link', { name: MANAGE_OTHER_TENANT });

    expect(tenantLink).toHaveAttribute('href', `/tenants/${MOCK_TENANT_ID}`);
    expect(otherLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_OTHER_TENANT_ID}`,
    );
  });

  it('links a not-yet-ready tenant to its provisioning page', () => {
    setup({
      tenants: [
        mockReadyTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        }),
        otherTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        }),
      ],
    });

    const tenantLink = screen.getByRole('link', { name: MANAGE_TENANT });
    const otherLink = screen.getByRole('link', { name: MANAGE_OTHER_TENANT });

    expect(tenantLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_TENANT_ID}/provisioning`,
    );
    expect(otherLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_OTHER_TENANT_ID}/provisioning`,
    );
  });

  describe('with one ready tenant', () => {
    beforeEach(() => {
      setup();
    });

    it('names the table region and the actions column', () => {
      const region = screen.getByRole('region', { name: 'Tenants' });
      const table = screen.getByRole('table');
      const actionsHeader = screen.getByRole('columnheader', {
        name: 'Actions',
      });

      expect(region).toContainElement(table);
      expect(actionsHeader).toBeVisible();
    });

    it('renders the created date as a machine-readable time', () => {
      const createdTime = screen.getByText('Apr 2, 2026');

      expect(createdTime).toHaveAttribute(
        'dateTime',
        MOCK_TENANT_CREATED_AT.toISOString(),
      );
    });
  });

  it('shows an empty state instead of a table when there are no tenants', () => {
    setup({ tenants: [] });

    const emptyMessage = screen.getByText('No tenants yet.');
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });
});
