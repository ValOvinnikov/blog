import { TENANT_PROVISIONING_STATUS } from '@blog/db';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeReadyTenant,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { TenantsTable } from './tenants-table';

const render = renderWithIntl;

const HARBOR_CO = 'Harbor Co.';
const HARBOR_DOMAIN = 'harbor.example.com';
const MANAGE_ACME = 'Manage Acme Inc.';
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

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.getByText(MOCK_TENANT_DOMAIN)).toBeVisible();
    expect(screen.getByText('Free')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();

    expect(screen.getByText(HARBOR_CO)).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('Suspended')).toBeVisible();
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

    expect(screen.getByRole('link', { name: MANAGE_ACME })).toHaveAttribute(
      'href',
      `/tenants/${TENANT_ID}`,
    );
    expect(
      screen.getByRole('link', { name: MANAGE_HARBOR_CO }),
    ).toHaveAttribute('href', `/tenants/${MOCK_OTHER_TENANT_ID}`);
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

    expect(screen.getByRole('link', { name: MANAGE_ACME })).toHaveAttribute(
      'href',
      `/tenants/${TENANT_ID}/provisioning`,
    );
    expect(
      screen.getByRole('link', { name: MANAGE_HARBOR_CO }),
    ).toHaveAttribute('href', `/tenants/${MOCK_OTHER_TENANT_ID}/provisioning`);
  });

  describe('with one ready tenant', () => {
    beforeEach(() => {
      render(<TenantsTable tenants={[makeReadyTenant()]} />);
    });

    it('names the scrollable table region and the actions column for screen readers', () => {
      expect(screen.getByRole('region', { name: 'Tenants' })).toContainElement(
        screen.getByRole('table'),
      );
      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeVisible();
    });

    it('renders the created date as a machine-readable time', () => {
      expect(screen.getByText('Apr 2, 2026')).toHaveAttribute(
        'dateTime',
        MOCK_TENANT_CREATED_AT.toISOString(),
      );
    });
  });

  it('renders an empty state instead of an empty table when there are no tenants', () => {
    render(<TenantsTable tenants={[]} />);

    expect(screen.getByText('No tenants yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
