import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { useRouter } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockReadyClientTenant,
  mockTenantsListQuery,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { TenantsTable } from './tenants-table';

vi.mock('@platform/i18n/navigation');

const setup = customRender(TenantsTable, {
  tenants: [mockReadyClientTenant()],
  listQuery: mockTenantsListQuery(),
  toolbar: null,
});

const otherTenant = (overrides: Partial<TTenant> = {}) =>
  mockReadyClientTenant({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    ...overrides,
  });

const MANAGE_TENANT = `Manage ${MOCK_TENANT_NAME}`;
const MANAGE_OTHER_TENANT = `Manage ${MOCK_OTHER_TENANT_NAME}`;
const ARIA_SORT = 'aria-sort';
const TENANT_COLUMN = 'Tenant';
const CREATED_COLUMN = 'Created';

describe(`<${TenantsTable.name}/>`, () => {
  it("shows each tenant's name, domain, plan and status", () => {
    setup({
      tenants: [
        mockReadyClientTenant(),
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
    setup({ tenants: [mockReadyClientTenant(), otherTenant()] });

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
        mockReadyClientTenant({
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

  it('shows an empty state when there are no tenants', () => {
    setup({ tenants: [] });

    const emptyMessage = screen.getByText('No tenants yet.');
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('names the search when no tenant matches it', () => {
    setup({
      tenants: [],
      listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }),
    });

    const emptyMessage = screen.getByText(
      `No tenants match “${MOCK_TENANT_SLUG}”.`,
    );

    expect(emptyMessage).toBeVisible();
  });

  describe('sorting', () => {
    const push = vi.fn();

    beforeEach(() => {
      push.mockReset();
      vi.mocked(useRouter).mockReturnValue({ ...useRouter(), push });
    });

    it('announces the created column as sorted newest first by default', () => {
      setup();

      const createdHeader = screen.getByRole('columnheader', {
        name: CREATED_COLUMN,
      });
      const tenantHeader = screen.getByRole('columnheader', {
        name: TENANT_COLUMN,
      });

      expect(createdHeader).toHaveAttribute(
        ARIA_SORT,
        SORT_DIRECTION.DESCENDING,
      );
      expect(tenantHeader).not.toHaveAttribute(ARIA_SORT);
    });

    it('sorts another column ascending when its header is clicked', async () => {
      const user = userEvent.setup();
      setup();

      const tenantSort = screen.getByRole('button', { name: TENANT_COLUMN });
      await user.click(tenantSort);

      expect(push).toHaveBeenCalledWith(
        '/tenants?sort=NAME&direction=ascending',
      );
    });

    it('reverses the sorted column when its header is clicked again', async () => {
      const user = userEvent.setup();
      setup({
        listQuery: mockTenantsListQuery({
          sort: {
            column: TENANT_SORT_COLUMN.PLAN,
            direction: SORT_DIRECTION.ASCENDING,
          },
        }),
      });

      const planSort = screen.getByRole('button', { name: 'Plan' });
      await user.click(planSort);

      expect(push).toHaveBeenCalledWith(
        '/tenants?sort=PLAN&direction=descending',
      );
    });
  });
});
