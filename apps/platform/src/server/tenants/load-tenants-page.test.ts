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
const listQuery = mockTenantsListQuery({
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
    await loadTenantsPage(listQuery);

    expect(listTenantsPageMock).toHaveBeenCalledExactlyOnceWith({
      includeArchived: listQuery.shouldShowArchived,
      sort: listQuery.sort,
      search: listQuery.search,
      page: listQuery.page,
      pageSize: TENANTS_PAGE_SIZE,
    });
  });

  it('returns the rows, the total and the page count', async () => {
    const data = await loadTenantsPage(listQuery);

    expect(data).toEqual({
      rows: MOCK_ROWS,
      total: MOCK_TOTAL,
      totalPages: MOCK_TOTAL_PAGES,
    });
  });

  it('sends a page past the end to the last page, keeping the filters', async () => {
    const pastEnd = { ...listQuery, page: MOCK_TOTAL_PAGES + 1 };

    await expect(loadTenantsPage(pastEnd)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(
      adminRoutes.tenants({ ...listQuery, page: MOCK_TOTAL_PAGES }),
    );
  });
});
