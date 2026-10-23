import { AUDIT_TARGET_TYPE } from '@blog/config';
import { FINDING_STATUS } from '@blog/config/constants';
import { ADMIN_ROLE } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  INVITED_PENDING_TEXT,
  makeTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_URL,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import TenantOverviewPage from './page';

const {
  requireTenantByIdMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: vi.fn(async () => ({
    id: 'admin-1',
    role: ADMIN_ROLE.ADMIN,
  })),
}));

vi.mock('@platform/server/tenants/tenant-suspension-actions', () => ({
  suspendTenantAction: vi.fn(),
  liftTenantSuspensionAction: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    findings: { listFindingsForTenant: listFindingsForTenantMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const setup = customRenderAsync(TenantOverviewPage, {
  params: Promise.resolve({ tenantId: TENANT_ID }),
});

const AT_20260812_0000 = '2026-08-12T00:00:00.000Z';
const INVITED_EXAMPLE_COM = 'invited@example.com';

describe(TenantOverviewPage, () => {
  let tenant: ReturnType<typeof makeTenant>;

  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    tenant = makeTenant();
    requireTenantByIdMock.mockResolvedValue({ tenant: tenant });
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date(AT_20260812_0000),
    });
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockReset();
    listFindingsForTenantMock.mockResolvedValue([]);
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the overview for the resolved tenant', () => {
      expect(requireTenantByIdMock).toHaveBeenCalledWith(TENANT_ID);
      expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
        tenant.id,
      );
      expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
        MOCK_TENANT_DOMAIN,
      );
      expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
        AUDIT_TARGET_TYPE.TENANT,
        tenant.id,
        { limit: 5 },
      );
      expect(listFindingsForTenantMock).toHaveBeenCalledWith(
        tenant.id,
        FINDING_STATUS.OPEN,
      );

      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TENANT_NAME,
      });
      expect(heading).toBeVisible();
    });

    it('shows the owner membership join date in the Joined row', () => {
      const joinedLabel = screen.getByText('Joined');
      const joinedTime = screen.getByText('Aug 12, 2026');
      expect(joinedLabel).toBeVisible();
      expect(joinedTime).toBeVisible();
      expect(joinedTime).toHaveAttribute('dateTime', AT_20260812_0000);
    });

    it('always shows "Open site", pointing at the tenant\'s live domain', () => {
      const openSiteLink = screen.getByRole('link', {
        name: 'Open site (opens in new tab)',
      });
      expect(openSiteLink).toHaveAttribute('href', MOCK_TENANT_URL);
    });

    it('never shows an "Open Studio" action — Studio opens from the sidebar', () => {
      const openStudioLink = screen.queryByRole('link', {
        name: 'Open Studio →',
      });
      expect(openStudioLink).not.toBeInTheDocument();
    });

    it('shows the healthy empty state when the tenant has no open findings', () => {
      const emptyState = screen.getByText(
        "No open findings for this tenant — everything's healthy.",
      );
      expect(emptyState).toBeVisible();
    });
  });

  it('shows the invited email without a Joined row for a pending invite', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: INVITED_EXAMPLE_COM,
    });

    await setup();

    const joinedLabel = screen.queryByText('Joined');
    const invitedEmail = screen.getByText(INVITED_EXAMPLE_COM);
    expect(joinedLabel).not.toBeInTheDocument();
    expect(invitedEmail).toBeVisible();
  });

  it('shows the invited-pending badge when the tenant has no owner', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue(undefined);

    await setup();

    const pendingBadge = screen.getByText(INVITED_PENDING_TEXT);
    expect(pendingBadge).toBeVisible();
  });

  it("renders the tenant's open findings from listFindingsForTenant", async () => {
    listFindingsForTenantMock.mockResolvedValue([makeFinding()]);

    await setup();

    const finding = screen.getByText('Provisioning step failed');
    expect(finding).toBeVisible();
  });

  it('renders the overview without waiting for the Vercel domain status', async () => {
    getDomainVerificationStatusMock.mockReturnValue(new Promise(() => {}));

    await setup();

    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TENANT_NAME,
    });
    const ownerHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Owner',
    });
    const activityHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Recent activity',
    });
    const domainHeading = screen.queryByRole('heading', {
      level: 2,
      name: 'Domain',
    });
    const skeletons = screen.getAllByTestId('skeleton');

    expect(pageHeading).toBeVisible();
    expect(ownerHeading).toBeVisible();
    expect(activityHeading).toBeVisible();
    expect(domainHeading).not.toBeInTheDocument();
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
