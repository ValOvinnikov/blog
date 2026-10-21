import { AUDIT_TARGET_TYPE } from '@blog/config';
import { FINDING_STATUS } from '@blog/config/constants';
import { ADMIN_ROLE } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

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
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantOverviewPage, () => {
  let tenant: ReturnType<typeof makeTenant>;

  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    tenant = makeTenant();
    requireTenantByIdMock.mockResolvedValue({ tenant: tenant });
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date('2026-08-12T00:00:00.000Z'),
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
      expect(requireTenantByIdMock).toHaveBeenCalledWith('tenant-1');
      expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
        tenant.id,
      );
      expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
        'acme.example.com',
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
        name: 'Acme Inc.',
      });
      expect(heading).toBeVisible();
    });

    it('shows the owner membership join date in the Joined row', () => {
      const joinedLabel = screen.getByText('Joined');
      const joinedTime = screen.getByText('Aug 12, 2026');
      expect(joinedLabel).toBeVisible();
      expect(joinedTime).toBeVisible();
      expect(joinedTime).toHaveAttribute(
        'dateTime',
        '2026-08-12T00:00:00.000Z',
      );
    });

    it('always shows "Open site", pointing at the tenant\'s live domain', () => {
      const openSiteLink = screen.getByRole('link', {
        name: 'Open site (opens in new tab)',
      });
      expect(openSiteLink).toHaveAttribute('href', 'https://acme.example.com');
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
      email: 'invited@example.com',
    });

    await setup();

    const joinedLabel = screen.queryByText('Joined');
    const invitedEmail = screen.getByText('invited@example.com');
    expect(joinedLabel).not.toBeInTheDocument();
    expect(invitedEmail).toBeVisible();
  });

  it('shows the invited-pending badge when the tenant has no owner', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue(undefined);

    await setup();

    const pendingBadge = screen.getByText('Invited, pending');
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
      name: 'Acme Inc.',
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
