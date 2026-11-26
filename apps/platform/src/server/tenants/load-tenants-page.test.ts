import { TENANTS_PAGE_SIZE } from '@platform/constants/tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenantsListQuery,
  mockTenantsPageRow,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  NEXT_NAVIGATION_ERROR,
  SORT_DIRECTION,
  TENANT_SORT_COLUMN,
} from '@shinefold/config';
import { redirect } from 'next/navigation';

import { loadTenantsPage } from './load-tenants-page';

const { listTenantsPageMock } = vi.hoisted(() => ({
  listTenantsPageMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenantsPage: listTenantsPageMock } },
}));

const MOCK_ROWS = [mockTenantsPageRow()];
const MOCK_TOTAL = TENANTS_PAGE_SIZE * 2 + 1;
const MOCK_TOTAL_PAGES = 3;
const MOCK_LIST_QUERY = mockTenantsListQuery({
  shouldShowArchived: true,
  sort: {
    column: TENANT_SORT_COLUMN.NAME,
    direction: SORT_DIRECTION.ASCENDING,
  },
  search: MOCK_TENANT_SLUG,
  page: 2,
});

describe(loadTenantsPage, () => {
  beforeEach(() => {
    listTenantsPageMock.mockResolvedValue({
      rows: MOCK_ROWS,
      total: MOCK_TOTAL,
    });
  });

  it('reads the asked page of tenants, one page size at a time', async () => {
    await loadTenantsPage(MOCK_LIST_QUERY);

    expect(listTenantsPageMock).toHaveBeenCalledExactlyOnceWith({
      includeArchived: MOCK_LIST_QUERY.shouldShowArchived,
      sort: MOCK_LIST_QUERY.sort,
      search: MOCK_LIST_QUERY.search,
      page: MOCK_LIST_QUERY.page,
      pageSize: TENANTS_PAGE_SIZE,
    });
  });

  it('returns the rows, the total and the page count', async () => {
    const data = await loadTenantsPage(MOCK_LIST_QUERY);

    expect(data).toEqual({
      rows: MOCK_ROWS,
      total: MOCK_TOTAL,
      totalPages: MOCK_TOTAL_PAGES,
    });
  });

  it('sends a page past the end to the last page, keeping the filters', async () => {
    const pastEnd = { ...MOCK_LIST_QUERY, page: MOCK_TOTAL_PAGES + 1 };

    await expect(loadTenantsPage(pastEnd)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(
      adminRoutes.tenants({ ...MOCK_LIST_QUERY, page: MOCK_TOTAL_PAGES }),
    );
  });
});
