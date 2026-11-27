import messages from '@platform/i18n/messages/en.json';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockTenantByIdContext } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';

import TenantActivityPage from './page';

vi.mock('@platform/server/auth/require-tenant-by-id');

const requireTenantByIdMock = vi.mocked(requireTenantById);

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    auditEvents: {
      listAuditEventsForTarget: vi.fn(async () => []),
      countAuditEventsForTarget: vi.fn(async () => 0),
    },
  },
}));

const setup = customRenderAsync(TenantActivityPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  searchParams: Promise.resolve({}),
});

describe(`<${TenantActivityPage.name}/>`, () => {
  it("renders the requested tenant's activity", async () => {
    requireTenantByIdMock.mockResolvedValueOnce(
      mockTenantByIdContext(mockTenant()),
    );

    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.tenantActivityPage.title,
    });

    expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(heading).toBeVisible();
  });
});
