import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import TenantProvisioningPage from './page';

const { requireTenantByIdMock, getTenantOwnerEmailMock } = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
}));

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const { provisioningStatusView, deprovisionTenantControl } = messages;

const setup = customRenderAsync(TenantProvisioningPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantProvisioningPage.name}/>`, () => {
  beforeEach(() => {
    requireTenantByIdMock.mockResolvedValue({ tenant: mockTenant() });
    getTenantOwnerEmailMock.mockResolvedValue(MOCK_OWNER_EMAIL);
  });

  describe('with a resolved owner', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the provisioning status of the requested tenant', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: provisioningStatusView.pageTitle,
      });

      expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(heading).toBeVisible();
    });

    it('offers no deprovisioning control', () => {
      const deprovisionButton = screen.queryByRole('button', {
        name: deprovisionTenantControl.triggerButton,
      });

      expect(deprovisionButton).not.toBeInTheDocument();
    });
  });

  it('shows the invited-pending owner badge while the owner is unresolved', async () => {
    getTenantOwnerEmailMock.mockResolvedValueOnce(undefined);

    await setup();

    const invitedPendingBadge = screen.getByText(
      provisioningStatusView.ownerInvitedPendingBadge,
    );

    expect(invitedPendingBadge).toBeVisible();
  });
});
