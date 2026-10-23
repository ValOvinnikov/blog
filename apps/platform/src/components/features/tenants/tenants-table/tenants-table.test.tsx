import { TENANT_PROVISIONING_STATUS } from '@blog/db';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeReadyTenant,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { TenantsTable } from './tenants-table';

const render = renderWithIntl;

const HARBOR_CO = 'Harbor Co.';
const HARBOR_DOMAIN = 'harbor.example.com';
const MANAGE_ACME = `Manage ${MOCK_TENANT_NAME}`;
const MANAGE_HARBOR_CO = 'Manage Harbor Co.';

describe(`<${TenantsTable.name}/>`, () => {
  it('renders one row per tenant with its name, domain, plan and status', () => {
    render(
      <TenantsTable
        tenants={[
          makeReadyTenant(),
          makeReadyTenant({
            id: MOCK_OTHER_TENANT_ID,
            name: HARBOR_CO,
            primaryDomain: HARBOR_DOMAIN,
            plan: TENANT_PLAN.GROWTH,
            status: TENANT_STATUS.SUSPENDED,
          }),
        ]}
      />,
    );

    const acmeName = screen.getByText(MOCK_TENANT_NAME);
    const acmeDomain = screen.getByText(MOCK_TENANT_DOMAIN);
    const freePlan = screen.getByText('Free');
    const activeStatus = screen.getByText('Active');
    const harborName = screen.getByText(HARBOR_CO);
    const growthPlan = screen.getByText('Growth');
    const suspendedStatus = screen.getByText('Suspended');

    expect(acmeName).toBeVisible();
    expect(acmeDomain).toBeVisible();
    expect(freePlan).toBeVisible();
    expect(activeStatus).toBeVisible();
    expect(harborName).toBeVisible();
    expect(growthPlan).toBeVisible();
    expect(suspendedStatus).toBeVisible();
  });

  it('links a READY tenant\'s "Manage" control to its overview page', () => {
    render(
      <TenantsTable
        tenants={[
          makeReadyTenant(),
          makeReadyTenant({
            id: MOCK_OTHER_TENANT_ID,
            name: HARBOR_CO,
            primaryDomain: HARBOR_DOMAIN,
          }),
        ]}
      />,
    );

    const acmeLink = screen.getByRole('link', { name: MANAGE_ACME });
    const harborLink = screen.getByRole('link', { name: MANAGE_HARBOR_CO });

    expect(acmeLink).toHaveAttribute('href', `/tenants/${TENANT_ID}`);
    expect(harborLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_OTHER_TENANT_ID}`,
    );
  });

  it('links a not-yet-ready tenant\'s "Manage" control to its provisioning page', () => {
    render(
      <TenantsTable
        tenants={[
          makeReadyTenant({
            provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
          }),
          makeReadyTenant({
            id: MOCK_OTHER_TENANT_ID,
            name: HARBOR_CO,
            primaryDomain: HARBOR_DOMAIN,
            provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
          }),
        ]}
      />,
    );

    const acmeLink = screen.getByRole('link', { name: MANAGE_ACME });
    const harborLink = screen.getByRole('link', { name: MANAGE_HARBOR_CO });

    expect(acmeLink).toHaveAttribute(
      'href',
      `/tenants/${TENANT_ID}/provisioning`,
    );
    expect(harborLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_OTHER_TENANT_ID}/provisioning`,
    );
  });

  describe('with one ready tenant', () => {
    beforeEach(() => {
      render(<TenantsTable tenants={[makeReadyTenant()]} />);
    });

    it('names the scrollable table region and the actions column for screen readers', () => {
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

  it('renders an empty state instead of an empty table when there are no tenants', () => {
    render(<TenantsTable tenants={[]} />);

    const emptyMessage = screen.getByText('No tenants yet.');
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });
});
