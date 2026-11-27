import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockTenantByIdContext } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { ADMIN_ROLE } from '@shinefold/db/constants';

import TenantBillingPage from './page';

const { requireSuperAdminMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
}));

const BILLING_CONTENT_TEST_ID = 'billing-content';

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/require-tenant-by-id');

vi.mock('@platform/components/features/billing/billing-page-content', () => ({
  BillingPageContent: ({ isReadOnly }: { isReadOnly?: boolean }) => (
    <div data-testid={BILLING_CONTENT_TEST_ID}>{String(isReadOnly)}</div>
  ),
}));

const requireTenantByIdMock = vi.mocked(requireTenantById);

const setup = customRenderAsync(TenantBillingPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantBillingPage.name}/>`, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    requireTenantByIdMock.mockResolvedValue(
      mockTenantByIdContext(mockTenant()),
    );
  });

  it('renders the billing page read-only for a super admin', async () => {
    await setup();

    const content = screen.getByTestId(BILLING_CONTENT_TEST_ID);

    expect(content).toHaveTextContent('true');
  });

  it('never reads the tenant for a caller who is not a super admin', async () => {
    requireSuperAdminMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(requireTenantByIdMock).not.toHaveBeenCalled();
  });
});
