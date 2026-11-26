import { TENANTS_PAGE_SIZE } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockLocaleRouterPush } from '@platform/testing/mock-locale-router';
import { pinLabelsFor } from '@platform/testing/pinned-tenants/pin-labels';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import {
  mockOtherTenantsPageRow,
  mockTenantsListQuery,
  mockTenantsPageRow,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import {
  mockOtherPinnedTenant,
  mockPinnedTenant,
} from '@platform/testing/tenants/pinned-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantsTable } from './tenants-table';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/tenants/set-tenant-pin-action');

const setup = customRenderInPinnedTenants(TenantsTable, {
  tenants: [mockTenantsPageRow()],
  total: 1,
  totalPages: 1,
  listQuery: mockTenantsListQuery(),
  toolbar: null,
});

const tTable = makeEnTranslator('tenantsTable');
const tPlan = makeEnTranslator('planNames');
const tView = makeEnTranslator('tenantsView');
const tPagination = makeEnTranslator('pagination');
const TENANT_LABELS = pinLabelsFor(MOCK_TENANT_NAME);
const MANAGE_TENANT = tTable('manageAriaLabel', {
  tenantName: MOCK_TENANT_NAME,
});
const MANAGE_OTHER_TENANT = tTable('manageAriaLabel', {
  tenantName: MOCK_OTHER_TENANT_NAME,
});
const FREE_PLAN = tPlan(TENANT_PLAN.FREE);
const ACTIVE_STATUS = tTable(`status.${TENANT_STATUS.ACTIVE}`);
const CREATED_ON = 'Apr 2, 2026';
const ARIA_SORT = 'aria-sort';
const TENANT_COLUMN = tTable('columnTenant');
const CREATED_COLUMN = tTable('columnCreated');
const PLAN_COLUMN = tTable('columnPlan');
const MATCHED_HINT = tTable('matchedDomain', { domain: MOCK_CUSTOM_DOMAIN });
const MATCHED_LABEL = new RegExp(`^${tTable('matchedDomain', { domain: '' })}`);
const MOCK_TWO_TENANTS = [mockTenantsPageRow(), mockOtherTenantsPageRow()];
const MOCK_NO_TENANTS = { tenants: [], total: 0 };
const MOCK_TOTAL = 168;
const MOCK_TOTAL_PAGES = 7;
const MOCK_MIDDLE_PAGE = 2;
const MOCK_FILTERED_QUERY = mockTenantsListQuery({
  shouldShowArchived: true,
  sort: {
    column: TENANT_SORT_COLUMN.NAME,
    direction: SORT_DIRECTION.ASCENDING,
  },
  search: MOCK_TENANT_SLUG,
  page: MOCK_MIDDLE_PAGE,
});

describe(`<${TenantsTable.name}/>`, () => {
  it("shows each tenant's name, domain, plan and status", () => {
    setup({
      tenants: [
        mockTenantsPageRow(),
        mockOtherTenantsPageRow({
          plan: TENANT_PLAN.GROWTH,
          status: TENANT_STATUS.SUSPENDED,
        }),
      ],
    });

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const tenantDomain = screen.getByText(MOCK_TENANT_DOMAIN);
    const freePlan = screen.getByText(FREE_PLAN);
    const activeStatus = screen.getByText(ACTIVE_STATUS);
    const otherName = screen.getByText(MOCK_OTHER_TENANT_NAME);
    const growthPlan = screen.getByText(tPlan(TENANT_PLAN.GROWTH));
    const suspendedStatus = screen.getByText(
      tTable(`status.${TENANT_STATUS.SUSPENDED}`),
    );

    expect(tenantName).toBeVisible();
    expect(tenantDomain).toBeVisible();
    expect(freePlan).toBeVisible();
    expect(activeStatus).toBeVisible();
    expect(otherName).toBeVisible();
    expect(growthPlan).toBeVisible();
    expect(suspendedStatus).toBeVisible();
  });

  it("links each tenant's Manage button to its manage page", () => {
    setup({ tenants: MOCK_TWO_TENANTS });

    const tenantLink = screen.getByRole('link', { name: MANAGE_TENANT });
    const otherLink = screen.getByRole('link', { name: MANAGE_OTHER_TENANT });

    expect(tenantLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );
    expect(otherLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(MOCK_OTHER_TENANT_ID),
    );
  });

  it('gives an archived tenant no pin toggle but keeps its Manage link', () => {
    setup(
      {
        tenants: [mockTenantsPageRow({ deprovisionedAt: MOCK_ARCHIVED_AT })],
      },
      {
        pinnedTenants: [
          mockPinnedTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
        ],
      },
    );

    const pinToggle = screen.queryByRole('button', {
      name: TENANT_LABELS.pinLabel,
    });
    const unpinToggle = screen.queryByRole('button', {
      name: TENANT_LABELS.unpinLabel,
    });
    const manageLink = screen.getByRole('link', { name: MANAGE_TENANT });

    expect(pinToggle).not.toBeInTheDocument();
    expect(unpinToggle).not.toBeInTheDocument();
    expect(manageLink).toBeVisible();
  });

  it('gives each row a pin toggle named for its tenant', () => {
    setup(
      { tenants: MOCK_TWO_TENANTS },
      { pinnedTenants: [mockOtherPinnedTenant()] },
    );

    const pinToggle = screen.getByRole('button', {
      name: TENANT_LABELS.pinLabel,
    });
    const unpinToggle = screen.getByRole('button', {
      name: pinLabelsFor(MOCK_OTHER_TENANT_NAME).unpinLabel,
    });

    expect(pinToggle).not.toBePressed();
    expect(unpinToggle).toBePressed();
  });

  describe('with one ready tenant', () => {
    beforeEach(() => {
      setup();
    });

    it('names the table region and the actions column', () => {
      const region = screen.getByRole('region', { name: tView('title') });
      const table = screen.getByRole('table');
      const actionsHeader = screen.getByRole('columnheader', {
        name: tTable('columnActions'),
      });

      expect(region).toContainElement(table);
      expect(actionsHeader).toBeVisible();
    });

    it('labels each stacked cell with its column for phones', () => {
      const planCell = screen.getByRole('cell', {
        name: `${PLAN_COLUMN} ${FREE_PLAN}`,
      });
      const statusCell = screen.getByRole('cell', {
        name: `${tTable('columnStatus')} ${ACTIVE_STATUS}`,
      });
      const createdCell = screen.getByRole('cell', {
        name: `${CREATED_COLUMN} ${CREATED_ON}`,
      });

      expect(planCell).toBeVisible();
      expect(statusCell).toBeVisible();
      expect(createdCell).toBeVisible();
    });

    it('renders the created date as a machine-readable time', () => {
      const createdTime = screen.getByText(CREATED_ON);

      expect(createdTime).toHaveAttribute(
        'dateTime',
        MOCK_TENANT_CREATED_AT.toISOString(),
      );
    });
  });

  it('labels only the row a search matched through an extra address', () => {
    setup({
      tenants: [
        mockTenantsPageRow({ matchedDomain: MOCK_CUSTOM_DOMAIN }),
        mockOtherTenantsPageRow(),
      ],
      listQuery: mockTenantsListQuery({ search: MOCK_CUSTOM_DOMAIN }),
    });

    const [, matchedRow] = screen.getAllByRole('row');
    const labels = screen.getAllByText(MATCHED_LABEL);

    expect(matchedRow).toHaveTextContent(MATCHED_HINT);
    expect(labels).toHaveLength(1);
  });

  it('shows an empty state when there are no tenants', () => {
    setup(MOCK_NO_TENANTS);

    const emptyMessage = screen.getByText(tTable('empty'));
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('names the search when no tenant matches it', () => {
    setup({
      ...MOCK_NO_TENANTS,
      listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }),
    });

    const emptyMessage = screen.getByText(
      tTable('noMatches', { search: MOCK_TENANT_SLUG }),
    );

    expect(emptyMessage).toBeVisible();
  });

  describe('range and page controls under the rows', () => {
    describe('on a middle page of a long list', () => {
      beforeEach(() => {
        setup({
          tenants: MOCK_TWO_TENANTS,
          total: MOCK_TOTAL,
          totalPages: MOCK_TOTAL_PAGES,
          listQuery: MOCK_FILTERED_QUERY,
        });
      });

      it('shows the range and the total', () => {
        const range = screen.getByText(
          tTable('showing', {
            from: TENANTS_PAGE_SIZE + 1,
            to: TENANTS_PAGE_SIZE + 2,
            count: MOCK_TOTAL,
          }),
        );

        expect(range).toBeVisible();
      });

      it('shows the current page out of the page count', () => {
        const position = screen.getByText(
          tPagination('status', {
            page: MOCK_MIDDLE_PAGE,
            totalPages: MOCK_TOTAL_PAGES,
          }),
        );

        expect(position).toBeVisible();
      });

      it('links Next to the next page, keeping sort, search and visibility', () => {
        const next = screen.getByRole('link', {
          name: messages.pagination.next,
        });

        expect(next).toHaveAttribute(
          'href',
          adminRoutes.tenants({
            ...MOCK_FILTERED_QUERY,
            page: MOCK_MIDDLE_PAGE + 1,
          }),
        );
      });

      it('links Previous to the page before', () => {
        const previous = screen.getByRole('link', {
          name: messages.pagination.previous,
        });

        expect(previous).toHaveAttribute(
          'href',
          adminRoutes.tenants({
            ...MOCK_FILTERED_QUERY,
            page: MOCK_MIDDLE_PAGE - 1,
          }),
        );
      });
    });

    it.each([
      {
        edge: 'first',
        page: 1,
        disabled: messages.pagination.previous,
        linked: messages.pagination.next,
      },
      {
        edge: 'last',
        page: MOCK_TOTAL_PAGES,
        disabled: messages.pagination.next,
        linked: messages.pagination.previous,
      },
    ])(
      'disables the unavailable step on the $edge page',
      ({ page, disabled, linked }) => {
        setup({
          total: MOCK_TOTAL,
          totalPages: MOCK_TOTAL_PAGES,
          listQuery: mockTenantsListQuery({ page }),
        });

        const disabledStep = screen.getByRole('button', { name: disabled });
        const linkedStep = screen.getByRole('link', { name: linked });

        expect(disabledStep).toBeDisabled();
        expect(linkedStep).toBeVisible();
      },
    );

    describe('with everything on one page', () => {
      beforeEach(() => {
        setup({ tenants: MOCK_TWO_TENANTS, total: MOCK_TWO_TENANTS.length });
      });

      it('shows only the count', () => {
        const count = screen.getByText(
          tTable('count', { count: MOCK_TWO_TENANTS.length }),
        );

        expect(count).toBeVisible();
      });

      it('offers no pagination controls', () => {
        const navigation = screen.queryByRole('navigation', {
          name: messages.pagination.ariaLabel,
        });

        expect(navigation).not.toBeInTheDocument();
      });
    });

    it('is absent when there are no tenants', () => {
      setup(MOCK_NO_TENANTS);

      const count = screen.queryByText(tTable('count', { count: 0 }));

      expect(count).not.toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    let user: UserEvent;
    let push: ReturnType<typeof mockLocaleRouterPush>;

    beforeEach(() => {
      user = userEvent.setup();
      push = mockLocaleRouterPush();
    });

    describe('with the default sort', () => {
      beforeEach(() => {
        setup();
      });

      it('announces the created column as sorted newest first', () => {
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
        const tenantSort = screen.getByRole('button', { name: TENANT_COLUMN });
        await user.click(tenantSort);

        expect(push).toHaveBeenCalledWith(
          '/tenants?sort=NAME&direction=ascending',
        );
      });
    });

    it('reverses the sorted column when its header is clicked again', async () => {
      setup({
        listQuery: mockTenantsListQuery({
          sort: {
            column: TENANT_SORT_COLUMN.PLAN,
            direction: SORT_DIRECTION.ASCENDING,
          },
        }),
      });

      const planSort = screen.getByRole('button', { name: PLAN_COLUMN });
      await user.click(planSort);

      expect(push).toHaveBeenCalledWith(
        '/tenants?sort=PLAN&direction=descending',
      );
    });
  });
});
