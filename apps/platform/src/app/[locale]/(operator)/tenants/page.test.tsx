import { TENANTS_PAGE_SIZE } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_SLUG,
  mockOtherTenantsPageRow,
  mockTenantsPageRow,
} from '@platform/testing/tenants/fixtures';
import { DEFAULT_TENANTS_SORT } from '@platform/utils/tenants-list-query/tenants-list-query';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { isEmailAccountConfigured } from '@shinefold/email';

import TenantsPage from './page';

const { listTenantsPageMock, listPinnedTenantsMock } = vi.hoisted(() => ({
  listTenantsPageMock: vi.fn(),
  listPinnedTenantsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-admin');
vi.mock('@platform/server/tenants/set-tenant-pin-action');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsPage: listTenantsPageMock },
    pinnedTenants: { listPinnedTenants: listPinnedTenantsMock },
  },
}));

vi.mock('@shinefold/email', async (importOriginal) => ({
  ...(await importOriginal()),
  isEmailAccountConfigured: vi.fn(),
}));

const MOCK_LATER_PAGE = 2;
const tPinned = makeEnTranslator('pinnedTenants');

const setup = customRenderAsync(TenantsPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${TenantsPage.name}/>`, () => {
  beforeEach(() => {
    listTenantsPageMock.mockResolvedValue({ rows: [], total: 0 });
    listPinnedTenantsMock.mockResolvedValue([]);
    vi.mocked(isEmailAccountConfigured).mockReturnValue(true);
  });

  it("lists the signed-in admin's pins, read by their admin row", async () => {
    listPinnedTenantsMock.mockResolvedValueOnce([mockOtherTenantsPageRow()]);

    await setup();

    const heading = screen.getByRole('heading', {
      name: tPinned('titleAccessible', { count: 1 }),
    });

    expect(heading).toBeVisible();
    expect(listPinnedTenantsMock).toHaveBeenCalledWith(mockAdmin().id);
  });

  it('lists the tenants it reads', async () => {
    listTenantsPageMock.mockResolvedValueOnce({
      rows: [mockTenantsPageRow()],
      total: 1,
    });

    await setup();

    const tenantName = screen.getByText(MOCK_TENANT_NAME);

    expect(tenantName).toBeVisible();
  });

  it('shows the extra address a search matched', async () => {
    listTenantsPageMock.mockResolvedValueOnce({
      rows: [mockTenantsPageRow({ matchedDomain: MOCK_CUSTOM_DOMAIN })],
      total: 1,
    });

    await setup({ searchParams: Promise.resolve({ q: MOCK_CUSTOM_DOMAIN }) });

    const hint = screen.getByText(MOCK_CUSTOM_DOMAIN, { exact: false });

    expect(hint).toBeVisible();
  });

  it.each([
    { archived: undefined, includeArchived: false },
    { archived: '1', includeArchived: true },
  ])(
    'reads archived tenants only when asked: $archived',
    async ({ archived, includeArchived }) => {
      await setup({ searchParams: Promise.resolve({ archived }) });

      expect(listTenantsPageMock).toHaveBeenCalledWith({
        includeArchived,
        sort: DEFAULT_TENANTS_SORT,
        search: '',
        page: 1,
        pageSize: TENANTS_PAGE_SIZE,
      });
    },
  );

  it('reads tenants in the sort, search and page the URL asks for', async () => {
    listTenantsPageMock.mockResolvedValueOnce({
      rows: [],
      total: TENANTS_PAGE_SIZE + 1,
    });

    await setup({
      searchParams: Promise.resolve({
        sort: TENANT_SORT_COLUMN.NAME,
        direction: SORT_DIRECTION.ASCENDING,
        q: MOCK_TENANT_SLUG,
        page: String(MOCK_LATER_PAGE),
      }),
    });

    expect(listTenantsPageMock).toHaveBeenCalledWith({
      includeArchived: false,
      sort: {
        column: TENANT_SORT_COLUMN.NAME,
        direction: SORT_DIRECTION.ASCENDING,
      },
      search: MOCK_TENANT_SLUG,
      page: MOCK_LATER_PAGE,
      pageSize: TENANTS_PAGE_SIZE,
    });
  });

  it('hides the email-alerts banner when Resend is configured', async () => {
    await setup();

    expect(isEmailAccountConfigured).toHaveBeenCalledWith(
      EMAIL_ACCOUNT.PLATFORM,
    );

    const banner = screen.queryByText(messages.emailAlertsBanner.title);

    expect(banner).not.toBeInTheDocument();
  });

  it('shows the email-alerts banner when Resend is not configured', async () => {
    vi.mocked(isEmailAccountConfigured).mockReturnValue(false);

    await setup();

    const banner = screen.getByText(messages.emailAlertsBanner.title);

    expect(banner).toBeVisible();
  });
});
